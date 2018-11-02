global.Promise = require('bluebird');

if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'development';
}

if (process.env.NODE_ENV === 'development') {
    Promise.config({
        longStackTraces: true
    });
}

const conf = require('am-lens/config');
const log = require('am-lens/log');
const Koa = require("koa");
const serve = require('koa-static-server');
const parser = require('koa-bodyparser');
const middleware = require('am-lens/middleware');
const template = require('am-lens/template');
const router = require('./routes');

const app = new Koa();

app.keys = [conf.get('session_key')];

// Always trust proxy fields
app.proxy = true;

app.use(middleware.logging);
app.use(middleware.error);
middleware.addSession(app);

template.setGlobalData({
    tokenId: conf.get('token_id'),
    tokenName: conf.get('token_name'),
    tokenSymbol: conf.get('token_symbol'),
    tokenDecimals: conf.get('token_decimals')
});

app.use(template.handlebarsMiddleware);

app.use(parser({
    enableTypes: ['json', 'form']
}));

app.use(router.routes());

let maxage = 0;

if (process.env.NODE_ENV === 'production') {
    maxage = 3600000;
}

app.use(serve({rootDir: 'public', rootPath: '/public', maxage}));

app.listen(process.env.PORT || '3000');

log.info(`Listening on port ${process.env.PORT || '3000'}`);