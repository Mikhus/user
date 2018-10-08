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
    property,
    IMessageQueue,
} from '@imqueue/rpc';
import * as mongoose from 'mongoose';

/**
 * Serializable user type
 */
export class UserObject {
    @property('string', true)
    _id?: string;

    @property('string')
    email: string;

    @property('string')
    password: string;

    @property('boolean')
    isActive: boolean;

    @property('string')
    firstName: string;

    @property('string')
    lastName: string;
}

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
                email: mongoose.SchemaTypes.String,
                password: mongoose.SchemaTypes.String,
                isActive: mongoose.SchemaTypes.Boolean,
                firstName: mongoose.SchemaTypes.String,
                lastName: mongoose.SchemaTypes.String,
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

        // update
        if (data._id) {
            const id = data._id;
            delete data._id;
            user = await this.UserModel.findByIdAndUpdate(id, data).exec();
        }
        // create
        else {
            user = new this.UserModel(data);
            await user.save();
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
}
