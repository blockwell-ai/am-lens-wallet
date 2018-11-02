const Router = require('koa-router');
const router = new Router();
const {isAuthenticated} = require('am-lens/auth');

router.use(isAuthenticated);

router.get('/', async ctx => {
    ctx.redirect('/app/wallet');
});

router.get('/wallet', async ctx => {
    await ctx.render('wallet');
});

router.get('/send', async ctx => {
    await ctx.render('send');
});

router.get('/transactions', async ctx => {
    await ctx.render('transactions');
});

router.get('/transactions/:hash', async ctx => {
    await ctx.render('transaction');
});


router.get('/transfers', async ctx => {
    await ctx.render('transfers');
});

router.get('/transfers/:address', async ctx => {
    await ctx.render('address_transfers', {address: ctx.params.address});
});

module.exports = router;
