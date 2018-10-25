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
import { IMQService, expose, profile, IMessageQueue } from '@imqueue/rpc';
import * as mongoose from 'mongoose';
import { md5 } from './helpers';
import { UserObject, UserFilters } from './types';
import { USER_DB } from '../config';

/**
 * User service implementation
 */
export class User extends IMQService {

    private db: mongoose.Connection;
    private UserModel: mongoose.Model<any>;

    /**
     * Transforms given filters into mongo-specific filters object
     *
     * @param {UserFilters} filters
     * @return {any}
     */
    private prepare(filters: UserFilters) {
        for (let filter of Object.keys(filters)) {
            if (~['isAdmin', 'isActive'].indexOf(filter)) {
                continue;
            }

            (filters as any)[filter] = {
                $regex: (filters as any)[filter],
                $options: 'i'
            };
        }

        return filters;
    }

    /**
     * Initializes mongo database connection and user schema
     *
     * @return Promise<any>
     */
    @profile()
    private async initDb(): Promise<any> {
        return new Promise((resolve, reject) => {
            mongoose.set('useCreateIndex', true);
            mongoose.set('useNewUrlParser', true);
            mongoose.connect(USER_DB);

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
                isActive: {
                    type: mongoose.SchemaTypes.Boolean,
                    default: true,
                },
                isAdmin: {
                    type: mongoose.SchemaTypes.Boolean,
                    default: false,
                },
                firstName: {
                    type: mongoose.SchemaTypes.String,
                    required: true,
                },
                lastName: {
                    type: mongoose.SchemaTypes.String,
                    required: true,
                },
                cars: {
                    type: [{
                        carId: mongoose.SchemaTypes.String,
                        regNumber: mongoose.SchemaTypes.String,
                    }],
                    required: false,
                    default: [],
                },
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
     * @param {string[]} [fields] - fields to return on success
     * @return {Promise<UserObject>} - saved user data object
     */
    @profile()
    @expose()
    public async update(
        data: UserObject,
        fields?: string[]
    ): Promise<UserObject> {
        let user;

        if (data.password) {
            data.password = md5(data.password);
        }

        // update
        if (data._id) {
            const _id = data._id;

            delete data._id;
            await this.UserModel.updateOne({ _id }, data).exec();

            return await this.fetch(_id, fields) as UserObject;
        }
        // create
        else {
            try {
                user = new this.UserModel(data);
                await user.save();

                return await this.fetch(data.email, fields) as UserObject;
            } catch (err) {
                if (/duplicate key/.test(err)) {
                    throw new TypeError(
                        'Duplicate e-mail, such user already exists'
                    );
                } else {
                    throw err;
                }
            }
        }
    }

    /**
     * Returns number of cars registered for the user having given id or email
     *
     * @param {string} idOrEmail
     * @return {Promise<number>}
     */
    @profile()
    @expose()
    public async carsCount(idOrEmail: string): Promise<number> {
        const field = /@/.test(idOrEmail) ? 'email' : '_id';
        const ObjectId = mongoose.Types.ObjectId;

        if (field === '_id') {
            idOrEmail = ObjectId(idOrEmail) as any;
        }

        console.log(field, idOrEmail, await this.UserModel.aggregate([
            { $match: { [field]: idOrEmail } },
            { $project: { carsCount: { $size: "$cars" } } }
        ]))

        return ((await this.UserModel.aggregate([
            { $match: { [field]: idOrEmail } },
            { $project: { carsCount: { $size: "$cars" } } }
        ]))[0] || {}).carsCount || 0
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
     * @param {UserFilters} [filters] - filter by is active criteria
     * @return {Promise<number>} - number of user counted
     */
    @profile()
    @expose()
    public async count(filters?: UserFilters): Promise<number> {
        return await this.UserModel.count(
            this.prepare(filters || {} as UserFilters)
        ).exec();
    }

    /**
     * Returns collection of users matched is active criteria. Records
     * can be fetched skipping given number of records and having max length
     * of a given limit argument
     *
     * @param {UserFilters} [filters] - is active criteria to filter user list
     * @param {string[]} [fields] - list of fields to be selected and returned for each found user object
     * @param {number} [skip] - record to start fetching from
     * @param {number} [limit] - selected collection max length from a starting position
     * @return {Promise<UserObject[]>} - collection of users found
     */
    @profile()
    @expose()
    public async find(
        filters?: UserFilters,
        fields?: string[],
        skip?: number,
        limit?: number,
    ): Promise<UserObject[]> {
        const query = this.UserModel.find(
            this.prepare(filters || {} as UserFilters)
        );

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
