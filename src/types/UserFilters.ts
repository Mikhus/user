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
 */
import { property } from '@imqueue/rpc';

/**
 * Serializable user type
 */
export class UserFilters {

    /**
     * User e-mail address
     * @type {string}
     */
    @property('string', true)
    email: string;

    /**
     * Active/inactive user flag
     * @type {boolean}
     */
    @property('boolean', true)
    isActive: boolean;

    /**
     * Admin role flag
     * @type {boolean}
     */
    @property('boolean', true)
    isAdmin: boolean;

    /**
     * User's first name field
     * @type {string}
     */
    @property('string', true)
    firstName?: string;

    /**
     * User's last name field
     * @type {string}
     */
    @property('string', true)
    lastName?: string;

}
