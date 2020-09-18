pragma solidity >0.4.0;

import "https://github.com/telcoin/ico/blob/master/contracts/Telcoin.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/math/SafeMath.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol"; //conflicting solidity versions on imports is causing issues with compiler


contract Staking is Ownable {
    using SafeMath for uint;
    
    //array[] whiteList placeholder;
    uint prereqTime = 30.4375 days; // average length of a month over 4 year span
    uint TotalLiquidity;  //in Eth
    uint monthlyTEL = 20000000;
    mapping (address => uint) private liquidityAmount;
    mapping (address => uint) private rewardTime; //tracks liquidity contribution by contributor
    mapping (address => uint) private rewardRatio; //could very likely go smaller on all these integers to save gas, but I left as 256 for now
    address[] internal liquidContributors;
    
    event Stake(address user, uint amount);
    event Reward(address benefactor, uint amount);
    
   //constructor?
    
    function withdraw() external onlyOwner {
        address payable _owner = address(uint(owner()));     // owner contract fund withdrawl, compiler too old for payable
        _owner.transfer(address(this).balance);
    }
    
    function isWhiteListed (address _address) public view returns (bool) {
        for (uint i = 0; i < whiteList.length; i++) {     //whiteList here could be imported, but I'm guessing might be easier to read externally depending on where that google doc is stored
            if (_address == whiteList[i]) {
                return (true);
        }
        return (false);
        }
    }
    
    function isContributor (address _address) public view returns (bool) {
        for (uint i = 0; i < liquidContributors.length; i++){
            if (_address == liquidContributors[i]) {
                return (true);
        }
        return (false);
        }
    }
    
    function newContributor (address _address) private {
        require(!isContributor(_address));
        liquidContributors.push(_address); 
    }
    
    function stake() public payable {
        if (!isContributor(msg.sender)) {
            newContributor(msg.sender);
        }
        // valueInTEL = some oracle or outside injection function which converts msg.value in Eth to TEL Token transfer equivalent
        require(Telcoin.transfer(address(this), valueInTEL));  //may need to be transferFrom, check if approval is necessary
        liquidityAmount[msg.sender] = add(liquidityAmount[msg.sender], msg.value);
        TotalLiquidity = add(TotalLiquidity, msg.value);
        rewardRatio[msg.sender] = div(liquidityAmount[msg.sender], TotalLiquidity);
        rewardTime[msg.sender] = add(now, prereqTime);
        emit Stake(msg.sender, msg.value);   //compiler necessary for Telcoin too old for this
    }
    
    function setRewardRatio(address _address, uint _ratio) public onlyOwner {
        rewardRatio[_address] = _ratio;
    }
    
    function setPrereqTime(uint _time) public onlyOwner {
        prereqTime = _time;
    }
    
    function reward(address _benefactor) private onlyOwner {
        require(rewardTime[_benefactor] <= now);
        require(isContributor(_benefactor));
        require(isWhiteListed(_benefactor));
        _payout = mul(rewardRatio, monthlyTEL); // this may need to be refactored depending on the weekly nature of monthlyTEL, or how much active control users have over their stake, we can discuss
        require(Telcoin.transfer(_benefactor, _payout)); // payout will need to be in TEL
        rewardTime[_benefactor] = add(now, prereqTime);
        emit Reward(_benefactor, _payout);
    }
}
    
