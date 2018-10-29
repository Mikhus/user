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
export const INTERNAL_ERROR = new Error(
    'Internal error occurred while executing operation');
export const ADD_CAR_LIMIT_EXCEEDED_ERROR = new Error(
    'Max number of cars exceeded!');
export const ADD_CAR_DUPLICATE_ERROR = new Error(
    'Car with the given registration number already exists!');
export const INVALID_CAR_ID_ERROR = new Error(
    'Invalid car identifier given!');
export const ADD_USER_DUPLICATE_ERROR = new TypeError(
    'Duplicate e-mail, such user already exists');
