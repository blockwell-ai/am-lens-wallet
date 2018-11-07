import {BigNumber} from 'bignumber.js';
import * as moment from "moment";

export function toDecimals(value, decimals) {
    return new BigNumber(value).dividedBy(new BigNumber(`1e${decimals}`)).toString();
}

export function toInteger(value, decimals) {
    return new BigNumber(value).multipliedBy(new BigNumber(`1e${decimals}`)).toFixed(0).toString();
}

export function renderAmount(value, symbol = window.tokenSymbol) {
    return toDecimals(value, window.tokenDecimals).toString() + ` <span class="token-symbol">${symbol}</span>`
}

export const weekAgo = moment().subtract(7, 'days');
export const inOneWeek = moment().add(7, 'days');

/**
 *
 * @param rawLocks
 * @return {{locks: Array, locked: BigNumber}}
 */
export function parseLocks(rawLocks) {
    let locks = [];
    let locked = new BigNumber(0);
    for (let i = 0, j = rawLocks.length / 2; i < j; i++) {
        let lock = {
            amount: new BigNumber(rawLocks[i * 2]),
            time: moment.unix(parseInt(rawLocks[i * 2 + 1]))
        };

        if (lock.time.isAfter()) {
            locks.push(lock);
            locked = locked.plus(lock.amount);
        }
    }

    locks.sort((a,b) => a.time - b.time);
    return {locks, locked};
}
