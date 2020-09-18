import {increase, duration} from './time.js';

const Staking = artifacts.require('Staking')
const Telcoin = artifacts.require('Telcoin')

contract('Staking', (accounts) => {
    let [deployer, account1, account2] = accounts;
    beforeEach(async () => {
        telcoin = await Telcoin.new();
        staking = await Staking.new();
        telcoin.transfer(account1, tokens(100), { from: deployer});
        web3.eth.sendTransaction({from: deployer, to: account1, value: TELinETH});
        telcoin.transfer(staking.address , valueInTEL, { from: account1}) ;
        const stake1 = await staking.stake({from: account1, to:staking.address , value: TELinETH}); //TELinETH is placeholder for equivalent value
    })
    it("checks staking, contributor/contributions, set functions, withdraw", async () => {
        const contributor = await staking.isContributor(account1, {from: deployer}); // contributor
        assert.equal(stake1.receipt.status, true); //stake
        assert.equal(contributor.receipt.status, true);
        assert.equal(contributor, true); 
        const liquid = await staking.liquidityAmount(account1); // liquidity
        assert.equal(liquid.toString(), TELinETH.toString())
        const ratio = await staking.rewardRatio(account1); //rewardRatio
        assert.equal(ratio.toString(), '1'); // may have some (or all) of these toString modifier's wrong, can't check because of compiler issues
        const time = await staking.rewardTime(account1); //rewardTime
        assert.greaterThan(time.toString(), (date.now + 2506000000).toString()); //is now plus 29 days in milliseconds, this is not great code, just using to demonstrate concept
        const setratio = await staking.setRewardRatio(account1, .001, {from: deployer}); //setRewardRatio
        assert.equal(ratio.toString(), '.001');
        const settime = await staking.setPrereqTime(account1, 600000, {from: deployer}); //setPrereqTime
        assert.equal(time.toString(), '600000');
        const withdraw = await staking.withdraw({from: deployer}); //withdraw
        assert.equal(staking.balance.toString(), '0')
    })
    
    it('emits a "Stake" event', async () => {
        const log = stake1.logs[0];
        log.event.should.eq('Stake');
        const event = log.args;
        event.user.should.equal(account1);
        event.amount.toString().should.equal(TELinETH.toString());
      })
    
    it("checks reward", async () => {
        const whitelist = await staking.isWhiteListed(account1, {from: deployer}); 
        assert.equal(stake1.receipt.status, true);
        assert.equal(whitelist.receipt.status, true);
        assert.equal(whitelist, true); 
        const reward = await staking.reward(account1, {from: deployer})
        const ratio = await staking.rewardRatio(account1);
        const monthly = await staking.monthlyTEL();
        const payout = ratio* monthlyTEL;
        assert.equal(reward, (ratio*monthlyTEL));
        
    })
    
    it('emits a "Reward" event', async () => {
        await time.increase(time.duration.days(30.4375));
        const reward = await staking.reward(account1, {from: deployer});
        const ratio = await staking.rewardRatio(account1);
        const monthly = await staking.monthlyTEL();
        const payout = ratio* monthlyTEL;
        const log = reward.logs[0];
        log.event.should.eq('Stake');
        const event = log.args;
        event.benefactor.should.equal(account1);
        event.amount.toString().should.equal(payout.toString());
      })
    
    it("should not allow staking of only ETH", async () => {
        try {
            await staking.stake({from: account2, to:staking.address , value: TELinETH}); // should throw because account2 never transferred TEL
            assert(true);
        }
        catch (err) {
            return;
        }
    assert(false, "Expected throw did not occur");
    
    })
        it("should not rewards before rewardTime", async () => {
        try {
            telcoin.transfer(account2, tokens(100), { from: deployer});
            web3.eth.sendTransaction({from: deployer, to: account2, value: TELinETH});
            telcoin.transfer(staking.address , valueInTEL, { from: account2}) ;
            const stake2 = await staking.stake({from: account2, to:staking.address , value: TELinETH});
            await time.increase(time.duration.days(29));       //this is allowed with ganache, not entirely sure with remix's hosting
            await staking.reward(account2, {from: deployer})    // will throw as only 29 of 30 days have occured
            assert(true);
        }
        catch (err) {
            return;
        }
    assert(false, "Expected throw did not occur");
    
    })
    
        it("should not allow rewards without isWhiteListed", async () => {
        try {
            await staking.reward(account2, {from: deployer})            // will throw if hasnt connected to google doc -> web3 -> whitelist pipeline
            assert(true);
        }
        catch (err) {
            return;
        }
    assert(false, "Expected throw did not occur");
    
    })
        it("should not allow rewards without isContributor", async () => {
        try {
            await staking.reward(account2, {from: deployer})         // will throw because account2 hasn't staked, and thus is false for isContributor   
            assert(true);
        }
        catch (err) {
            return;
        }
    assert(false, "Expected throw did not occur");
    
    })
})