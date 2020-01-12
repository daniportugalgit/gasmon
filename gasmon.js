/**
 * @author Daniel Portugal daniportugal@gmail.com
 * 
 * Gasmon monitors the current gas prices on the Ethereum blockchain and provides you
 * with the optimal value in WEI or GWEI for the desired speed, at any given moment.
**/

const defaultIntervalInMinutes = 3; //how many minutes between each price refresh
const defaultSpeed = 2; //index of speed[] (2 corresponds to "average" gas price)
const gasStationUrl = "https://ethgasstation.info/json/ethgasAPI.json";

var _speeds = [{ gwei:1, wait:7.1 }, { gwei:5, wait:3.5 }, { gwei:10, wait:0.5 }, { gwei:20, wait:0.5 }];
var _currentSpeed = defaultSpeed; //index of _speed[]
var _onNewSpeedCallback; //function to be called when new speed limits are received
var _suppressLogs;

var _optimized = true;
var _details;
/**
 * Initializes the system
 * @param onNewSpeedsFunction {function} the callback function for whenever new speeds are detected.
 * @param checkIntervalInMinutes {number} (optional) how many minutes between each price refresh; defaults to 3.
 * @param suppressLogs {bool} (optional) if true, won't print logs to the console; defaults to false.
 */
function init(onNewSpeedsFunction, checkIntervalInMinutes, suppressLogs) {
  _suppressLogs = suppressLogs;

  if(!_suppressLogs) console.log("Gasmon :: initializing. Optimization is active.");

  _onNewSpeedCallback = onNewSpeedsFunction;

  estimateGasCost();

  let interval = checkIntervalInMinutes || defaultIntervalInMinutes;
  setInterval(estimateGasCost, 1000*60*interval);
}

function estimateGasCost() {
  $.get(gasStationUrl, function(data, status){
    if(status == "success")
      onGasPricesReceived(data);
  });
}

function onGasPricesReceived(response) {
  _details = response;

  let newSpeed1 = { gwei: response.safeLow / 10, wait: response.safeLowWait };
  let newSpeed2 = { gwei: response.average / 10, wait: response.avgWait };
  let newSpeed3 = { gwei: response.fast / 10, wait: response.fastWait };
  let newSpeed4 = { gwei: response.fastest / 10, wait: response.fastestWait };

  if(_optimized) {
    if(newSpeed4.wait == newSpeed3.wait)
      newSpeed4 = newSpeed3;
  }

  if(_speeds[0].gwei != newSpeed1.gwei || _speeds[1].gwei != newSpeed2.gwei || _speeds[2].gwei != newSpeed3.gwei || _speeds[3].gwei != newSpeed4.gwei)
  {
      if(!_suppressLogs) console.log("Gasmon :: New speed limits: " + newSpeed1.gwei + " | " + newSpeed2.gwei + " | " + newSpeed3.gwei + " | " + newSpeed4.gwei);    

      _speeds[0] = newSpeed1;
      _speeds[1] = newSpeed2;
      _speeds[2] = newSpeed3;
      _speeds[3] = newSpeed4;

      if(_onNewSpeedCallback)
        _onNewSpeedCallback();
  }
}

/**
 * Returns the current speed
 * @return {number} a value from 1 to 4
 */
function currentSpeed() {
  return _currentSpeed;
}

/**
 * Returns the estimated waiting time for the currently selected speed
 * @return {number} the waiting time in seconds
 */
function currentWait() {
  return _speeds[_currentSpeed-1].wait;
}

/**
 * Returns a value in WEI corresponding to the chosen speed 
 * @param speed {number} the desired speed (a value from 1 to 4)
 * @return {number} value in WEI corresponding to the chosen speed 
 * @notice Omit the param speed to use the current speed
 */
function idealGasPrice(speed) {
  return idealGasPriceInGwei(speed) * 1000000000;
}

/**
 * Returns a value in GWEI corresponding to the chosen speed 
 * @param speed {number} the desired speed (a value from 1 to 4)
 * @return {number} value in GWEI corresponding to the chosen speed 
 * @notice Omit the param speed to use the current speed
 */
function idealGasPriceInGwei(speed) {
  if(!speed)
    speed = _currentSpeed;

  return _speeds[speed-1].gwei;  
}

/**
 * Switches to the next available speed. If at max speed, switches to min speed (cycles).
 * @return {number} a value from 1 to 4
 */
function nextSpeed() {
  let nextIndex = (_currentSpeed+1) % 4;

  setSpeed(nextIndex);
  
  return _currentSpeed;
}

/**
 * Sets the speed as desired.
 * @param speed {number} an integer from 1 to 4
 * @return {bool} true for success
 */
function setSpeed(speed) {
  if(speed < 1 || speed > 4)
    return false;

  _currentSpeed = speed;

  if(!_suppressLogs) console.log("Gasmon :: Default speed set to " + _currentSpeed + ".");

  return true;
}

/**
 * Gets the costs in GWEI for all available speeds
 * @return {array} the costs for each speed (in GWEI) and their waiting times (in seconds)
 * Something like [{gwei:1,wait:7},{gwei:3,wait:3.4},{gwei:10,wait:1},{gwei:20,wait:0.5}].
 */
function speeds() {
  return _speeds;
}

/**
 * Sets the optimization (true or false). When optimized == true, the system will check wheter the speed you're asking for
 * can be achieved by paying even less. That happens, for example, when the "fastest" speed has the same waiting time than
 * the "fast" speed. In that case, the system will use the speed "fast" even if you ask for "fastest".
 * @param {bool} trueOrFalse wheter the system should work optimized (true) or not (false).
 * @notice The default value is true
 */
function optimized(trueOrFalse) {
  _optimized = trueOrFalse;
  if(!_suppressLogs) console.log("Gasmon :: optimized: " + _optimized);
}

/**
 * Returns the last response received from Eth Gas Station.
 * @return {object} the last response gotten from Eth Gas Station's API
 * Something like:
 * {"fast": 80.0, "fastest": 350.0, "safeLow": 10.0, "average": 10.0, "block_time": 15.652173913043478, "blockNum": 9262855, "speed": 0.5371790597818887, "safeLowWait": 3.2, "avgWait": 3.2, "fastWait": 0.5, "fastestWait": 0.5, "gasPriceRange": {"350": 0.5, "330": 0.5, "310": 0.5, "290": 0.5, "270": 0.5, "250": 0.5, "230": 0.5, "210": 0.5, "190": 0.5, "180": 0.5, "170": 0.5, "160": 0.5, "150": 0.5, "140": 0.5, "130": 0.5, "120": 0.5, "110": 0.5, "100": 0.5, "90": 0.5, "80": 0.5, "70": 0.7, "60": 1.0, "50": 1.0, "40": 2.1, "30": 2.7, "20": 2.7, "10": 3.2, "8": 260.9, "6": 260.9, "4": 260.9}}
 */
function details() {
  return _details;
}

module.exports = {
  init,
  currentSpeed,
  idealGasPrice,
  idealGasPriceInGwei,
  nextSpeed,
  setSpeed,
  speeds,
  optimized,
  details
};
