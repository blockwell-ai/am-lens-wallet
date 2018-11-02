const conf = require('am-lens/config');
const validate = require('am-lens/middleware/validate');
const mail = require('../email');
const auth = require('am-lens/auth');
const strat = auth.getStrategy();
const crypto = require('crypto');
const hash = require('am-lens/hash');
const Router = require('koa-router');
const router = new Router();
const Joi = require('joi');
const {isAuthenticated} = require('am-lens/auth');
const {users} = require('am-lens/data');

const axios = require('axios');

/**
 * @type {AxiosInstance}
 */
const client = axios.create({
    baseURL: conf.get('apiminer_url'),
    maxContentLength: 1000000,
    headers: {
        'User-Agent': 'am-lens-cli',
        'Authorization': `Bearer ${conf.get('apiminer_token')}`
    }
});

router.use(isAuthenticated);

router.get('/user/:email/address', validate({
    params: {
        email: Joi.string().email()
    }
}), async ctx => {
    let email = ctx.params.email;
    let user = await users.find(email);

    if (!user) {
        let pass = crypto.randomBytes(10).toString('base64').replace(/[+\/=]/g, '');
        const hashed = await hash.hash(Buffer.from(pass));
        let auth = strat.buildAuthObject(hashed.toString('hex'));

        user = await users.create(email, auth);

        let response = await client.post('/users', {
            name: email,
            externalId: conf.get('app_prefix') + '-' + user.id,
            auth: true,
            account: true
        });

        user.apiminerId = response.data.data.id;
        user.apiminerToken = response.data.auth;
        user.data.address = response.data.account.address;

        await users.update(user);

        let url = `${ctx.request.protocol}://${ctx.request.host}`;
        mail.sendWelcome(ctx.state.user, user, url, pass)
            .catch(err => {
                ctx.log.warn('Failed to send welcome email', {
                    err: err,
                    recipient: user.email
                });
            });
    }

    ctx.body = {
        address: user.data.address
    }
});

module.exports = router;
