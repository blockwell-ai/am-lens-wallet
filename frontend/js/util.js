import {BigNumber} from 'bignumber.js';

export function toDecimals(value, decimals) {
    return new BigNumber(value).dividedBy(new BigNumber(`1e${decimals}`)).toString();
}

export function toInteger(value, decimals) {
    return new BigNumber(value).multipliedBy(new BigNumber(`1e${decimals}`)).toFixed(0).toString();
}
