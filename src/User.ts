/*!
 * ISC License
 * 
 * Copyright (c) 2018, Imqueue Sandbox
 * 
 * Permission to use, copy, modify, and/or distribute this software for any
 * purpose with or without fee is hereby granted, provided that the above
 * copyright notice and this permission notice appear in all copies.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
 * WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
 * MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
 * ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
 * WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
 * ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
 * OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
 * 
 */
import {
    IMQService,
    expose,
    profile,
    IMessageQueue,
} from '@imqueue/rpc';
import * as mongoose from 'mongoose';
import { md5 } from './helpers';
import { UserObject } from './types';

/**
 * User service implementation
 */
export class User extends IMQService {

    private db: mongoose.Connection;
    private UserModel: mongoose.Model<any>;

    /**
     * Initializes mongo database connection and user schema
     *
     * @return Promise<any>
     */
    @profile()
    private async initDb(): Promise<any> {
        return new Promise((resolve, reject) => {
            mongoose.connect(
                'mongodb://localhost/user',
                { useNewUrlParser: true },
            );
            this.db = mongoose.connection;
            this.db.on('error', reject);
            this.db.once('open', resolve);
            const schema = new mongoose.Schema({
                id: mongoose.SchemaTypes.ObjectId,
                email: {
                    type: mongoose.SchemaTypes.String,
                    unique: true,
                    required: true,
                },
                password: {
                    type: mongoose.SchemaTypes.String,
                    required: true,
                },
                isActive: mongoose.SchemaTypes.Boolean,
                isAdmin: mongoose.SchemaTypes.Boolean,
                firstName: {
                    type: mongoose.SchemaTypes.String,
                    required: true,
                },
                lastName: {
                    type: mongoose.SchemaTypes.String,
                    required: true,
                }
            });
            this.UserModel = mongoose.model('User', schema);
        });
    }

    /**
     * Overriding start method to inject mongodb connection establishment
     */
    @profile()
    public async start(): Promise<IMessageQueue | undefined> {
        this.logger.log('Initializing MongoDB connection...');
        await this.initDb();
        return super.start();
    }

    /**
     * Creates or updates existing user with the new data set
     *
     * @param {UserObject} data - user data fields
     * @return {Promise<UserObject>} - saved user data object
     */
    @profile()
    @expose()
    public async update(data: UserObject): Promise<UserObject> {
        let user;

        if (data.password) {
            data.password = md5(data.password);
        }

        // update
        if (data._id) {
            const id = data._id;
            delete data._id;

            await this.UserModel.findByIdAndUpdate(id, data).exec();
            user = await this.fetch(id);
        }
        // create
        else {
            try {
                user = new this.UserModel(data);
                await user.save();
            } catch (err) {
                if (/duplicate key/.test(err)) {
                    throw new TypeError(
                        'Duplicate e-mail, such user already exists'
                    );
                }
            }
        }

        return user as UserObject;
    }

    /**
     * Activates user in the system
     *
     * @param {string} id - user identifier in the system
     * @return {Promise<boolean>} - operation execution result
     */
    @profile()
    @expose()
    public async activate(id: string): Promise<boolean> {
        try {
            await this.UserModel
                .findByIdAndUpdate(id, { isActive: true })
                .exec();
            return true;
        } catch (err) {
            this.logger.warn('Error when activating user:', err);
            return false;
        }
    }

    /**
     * Deactivates user in the system
     *
     * @param {string} id - user identifier in the system
     * @return {Promise<boolean>} - operation execution result
     */
    @profile()
    @expose()
    public async deactivate(id: string): Promise<boolean> {
        try {
            await this.UserModel
                .findByIdAndUpdate(id, { isActive: false })
                .exec();
            return true;
        } catch (err) {
            this.logger.warn('Error when deactivating user:', err);
            return false;
        }
    }

    /**
     * Look-ups and returns user data by either user e-mail or by user object
     * identifier
     *
     * @param {string} criteria - user identifier or e-mail string
     * @param {string[]} [fields] - fields to select and return
     * @return {Promise<UserObject | null>} - found user object or nothing
     */
    @profile()
    @expose()
    public async fetch(
        criteria: string,
        fields?: string[]
    ): Promise<UserObject | null> {
        let query: mongoose.DocumentQuery<UserObject | null, any>;

        if (criteria.match('@')) {
            query = this.UserModel.findOne().where({
                email: criteria
            });
        } else {
            query = this.UserModel.findById(criteria);
        }

        if (fields && fields.length) {
            query.select(fields.join(' '));
        }

        return await query.exec();
    }

    /**
     * Returns number of users stored in the system and matching given criteria
     *
     * @param {boolean} [isActive] - filter by is active criteria
     * @return {Promise<number>} - number of user counted
     */
    @profile()
    @expose()
    public async count(isActive?: boolean): Promise<number> {
        if (typeof isActive === 'undefined') {
            return await this.UserModel.count({}).exec();
        }
        else {
            return await this.UserModel.count({ isActive }).exec();
        }
    }

    /**
     * Returns collection of users matched is active criteria. Records
     * can be fetched skipping given number of records and having max length
     * of a given limit argument
     *
     * @param {boolean} [isActive] - is active criteria to filter user list
     * @param {string[]} [fields] - list of fields to be selected and returned for each found user object
     * @param {number} [skip] - record to start fetching from
     * @param {number} [limit] - selected collection max length from a starting position
     * @return {Promise<UserObject[]>} - collection of users found
     */
    @profile()
    @expose()
    public async find(
        isActive?: boolean,
        fields?: string[],
        skip?: number,
        limit?: number,
    ): Promise<UserObject[]> {
        const criteria = typeof isActive !== 'boolean' ? {} : { isActive };
        const query = this.UserModel.find(criteria);

        if (fields && fields.length) {
            query.select(fields.join(' '));
        }

        if (skip) {
            query.skip(skip);
        }

        if (limit) {
            query.limit(limit);
        }

        const users = await query.exec();

        return users as UserObject[];
    }

}
