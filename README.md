


# Gasmon
Gasmon monitors the current Gas prices on the Ethereum blockchain.
It allows you to **select a speed for your transactions** based on the data provided by Eth Gas Station (https://ethgasstation.info/), instead of setting gasPrice manually.

It periodically consumes Eth Gas Station's API to get the four basic speeds ("safeLow", "average", "fast" and "fastest"), their corresponding Gas prices and estimated waiting times.

Gasmon provides you with the optimal Gas price for the desired speed, at any given moment.

**REQUIREMENTS**: jQuery, which is used for $.get()

## Usage
1) **Install** it with `npm install gasmon`
2) **Import** it in your project with `import Gasmon from 'gasmon';`
3) **Initialize** it with `Gasmon.init();`
4) Access the ideal Gas price with `Gasmon.idealGasPrice(speed)`, where `speed` is an integer from 1 to 4, representing the speeds "SafeLow", "Average", "Fast" and "Fastest". Omit `speed` to use the default speed (2).

_Example:_ `Gasmon.idealGasPrice(3)` will return the gasPrice necessary to make a "fast" transaction at the moment.

_Example inside a transaction call:_

    contract.mint(to, tokens, {from:_user, gasPrice:Gasmon.idealGasPrice(3)})
        .then(function(receipt){
            onResult(receipt);
        });

## Motivation
Sometimes you want to pay **as low as you can** for a tx, but you're afraid _it might get stuck_.
Sometimes you want to pay **as high as it takes**, _but not more than you need_, to make your tx blazing fast.
\
Gasmon solves this problem by seamlessly delivering Eth Gas Station's gasPrice estimates to your system.
\
 The lowest value, corresponding to speed 1 ("safeLow"), is never less than what's being accepted by miners in the network. According to Eth Gas Station, _"this price is determined by the lowest price where at least 5% of the network hash power will accept it."_
\
The highest value, corresponding to speed 4 ("fastest"), is never more than what you need. According to Eth Gas Station, _"paying more than this price is unlikely to increase transaction confirmation time under normal circumstances."_

No more worries, no more overspending.


## More details:
* Initialize it with `Gasmon.init(callbackFunction,checkIntervalInMinutes,suppressLogs)`
* All parameters are optional.
* If you pass a `callbackFunction`, it will be called whenever the costs change in the network (and once as soon as it initializes).
* If you omit `checkIntervalInMinutes`, it defaults to 3. This is how long Gasmon takes to update gasPrices.
* If you omit `suppressLogs`, it defaults to `false` and you will see a console.log whenever speeds change.
 * Access the ideal Gas price with `Gasmon.idealGasPrice(speed)`, where `speed` is an integer from 1 to 4, representing the four available speeds.
 
* You can also use `Gasmon.idealGasPriceInGwei(speed)` to get the value in GWEI.
* If you omit the value `speed` when calling theses functions, the system will use the default speed (2).
* `Gasmon.setSpeed(speed)` changes the default speed to `speed` (an integer from 1 to 4).
* `Gasmon.nextSpeed()` cycles the default speed between the available speeds.
* `Gasmon.currentSpeed()` consults what's the default speed. It returns an integer from 1 to 4.
* `Gasmon.currentWait()` returns the estimated waiting time in minutes for the default speed.
* `Gasmon.optimized(false)` deactivates optimization (active by default). When optimized, the system will check whether a given speed can be achieved by paying even less. That happens, for example, when the "fastest" speed has the same waiting time than the "fast" speed. In that case, the system will automatically use the "fast" speed costs for the "fastest" speed.
_It's unclear why Eth Gas Station's waiting times for "fast" and "fastest" speeds sometimes coincide while having different costs, but they eventually do. By having optimization active you don't have to worry about that. Gasmon will select the lowest possible cost for the "fastest" speed._
* `Gasmon.speeds()` returns an array with the GWEI costs for the four speeds and their respective waiting times in minutes. It will return an array like this:
    `[{gwei:1,wait:5},{gwei:2,wait:2.9},{gwei:5,wait:1},{gwei:9,wait:0.5}]`

    
* `Gasmon.details()` returns the last response gotten from Eth Gas Station's API, without any treatment. It will be something like this: `{"fast": 80.0, "fastest": 350.0, "safeLow": 10.0, "average": 10.0, "block_time": 15.652173913043478, "blockNum": 9262855, "speed": 0.5371790597818887, "safeLowWait": 3.2, "avgWait": 3.2, "fastWait": 0.5, "fastestWait": 0.5, "gasPriceRange": {"350": 0.5, "330": 0.5, "310": 0.5, "290": 0.5, "270": 0.5, "250": 0.5, "230": 0.5, "210": 0.5, "190": 0.5, "180": 0.5, "170": 0.5, "160": 0.5, "150": 0.5, "140": 0.5, "130": 0.5, "120": 0.5, "110": 0.5, "100": 0.5, "90": 0.5, "80": 0.5, "70": 0.7, "60": 1.0, "50": 1.0, "40": 2.1, "30": 2.7, "20": 2.7, "10": 3.2, "8": 260.9, "6": 260.9, "4": 260.9}}`