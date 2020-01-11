/**
 * @author Daniel Portugal daniportugal@gmail.com
 * 
 * Gasmon monitors the current gas prices on the Ethereum blockchain.
 * It periodically consumes Ethgasstation's API to get the four basic speeds ("safeLow", "average", "fast" and "fastest"),
 * and their corresponding gas prices.
 * Gasmon provides you with the optimal value in WEI or GWEI for the desired speed, at any given moment.
 *
 * Usage:
 * Import it with const Gasmon = require('./gasmon.js'); // or import Gasmon from 'gasmon';
 * Initialize it with Gasmon.init();
 * Access the current gas costs with Gasmon.idealGasPrice(speed);
 *
 * More details:
 * Initialize it with Gasmon.init(callbackFunction,checkIntervalInMinutes,suppressLogs).
 * All parameters are optional.
 * If you pass a callbackFunction, it will be called whenever the costs change in the network (and once as soon as it initializes).
 * If you omit checkIntervalInMinutes, it defaults to 3.
 * If you omit suppressLogs, it defaults to false and you will see a console.log whenever speeds change.
 * 
 * Access the current gas costs with Gasmon.idealGasPrice(speed), 
 * where speed is an integer from 1 to 4, representing the four available speeds.
 * Example: Gasmon.idealGasPrice(3) will return the value in WEI necessary to make a "fast" transaction at the moment.
 * You can also use Gasmon.idealGasPriceInGwei(speed) to get the value in GWEI.
 *
 * If you omit the value `speed` when calling theses functions, the system will use the currently selected speed (defaults to 2).
 * To cycle the selection between the available speeds, call Gasmon.nextSpeed();
 *
 * Consult what's the current speed by calling Gasmon.currentSpeed(); It returns an integer from 1 to 4.
 *
 * Get an array with the GWEI costs for the four speeds by calling Gasmon.speeds();
 * It will return something like [1,3,10,18] meaning that to make a "safeLow" transaction you will pay 1 GWEI per gas unit;
 * (an "average" transaction would cost 3 GWEI per gas, and so forth).
 *
 * REQUIREMENTS: jQuery, which is used for $.get()
**/

const defaultIntervalInMinutes = 3; //how many minutes between each price refresh
const defaultSpeed = 2; //index of speed[] (2 corresponds to "average" gas price)
const gasStationUrl = "https://ethgasstation.info/json/ethgasAPI.json";

var _currentSpeed = defaultSpeed; //index of speed[]
var _speed = [0, 1, 5, 10, 20]; //unused, safeLow, average, fast, fastest (default values)
var _onNewSpeedCallback; //function to be called when new speed limits are received

var _suppressLogs;
/**
 * Initializes the system
 * @param onNewSpeedsFunction {function} the callback function for whenever new speeds are detected.
 * @param checkIntervalInMinutes {number} (optional) how many minutes between each price refresh; defaults to 3.
 * @param suppressLogs {bool} (optional) if true, won't print logs to the console; defaults to false.
 */
function init(onNewSpeedsFunction, checkIntervalInMinutes, suppressLogs) {
  _suppressLogs = suppressLogs;

  if(!_suppressLogs) console.log("Gasmon :: initializing...");

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
  let newSpeed1 = Math.ceil(response.safeLow / 10);
  let newSpeed2 = Math.ceil(response.average / 10);
  let newSpeed3 = Math.ceil(response.fast / 10);
  let newSpeed4 = Math.ceil(response.fastest / 10);

  if(_speed[1] != newSpeed1 || _speed[2] != newSpeed2 || _speed[3] != newSpeed3 || _speed[4] != newSpeed4)
  {
      if(!_suppressLogs) console.log("Gasmon :: New speed limits: " + newSpeed1 + " | " + newSpeed2 + " | " + newSpeed3 + " | " + newSpeed4);    

      _speed[1] = newSpeed1;
      _speed[2] = newSpeed2;
      _speed[3] = newSpeed3;
      _speed[4] = newSpeed4;

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
 * Returns a value in WEI corresponding to the chosen speed 
 * @param speed {number} the desired speed (a value from 1 to 4)
 * @return value {number} value in WEI corresponding to the chosen speed 
 * @notice Omit the param speed to use the current speed
 */
function idealGasPrice(speed) {
  if(!speed)
    return _speed[_currentSpeed] * 1000000000;

  return _speed[speed] * 1000000000;
}

/**
 * Returns a value in GWEI corresponding to the chosen speed 
 * @param speed {number} the desired speed (a value from 1 to 4)
 * @return {number} value in GWEI corresponding to the chosen speed 
 * @notice Omit the param speed to use the current speed
 */
function idealGasPriceInGwei(speed) {
  if(!speed)
    return _speed[_currentSpeed];

  return _speed[speed];  
}

/**
 * Switches to the next available speed. If at max speed, switches to min speed (cycles).
 * @return {number} a value from 1 to 4
 */
function nextSpeed() {
  let nextIndex = (_currentSpeed+1) % 5;
  if(nextIndex == 0) { nextIndex = 1 }

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
 * @return {array} the costs in GWEI for each speed; something like [1,3,10,18].
 */
function speeds() {
  let trimmedSpeeds = _speed.slice(0);
  trimmedSpeeds.shift();
  return trimmedSpeeds;
}

module.exports = {
  init,
  currentSpeed,
  idealGasPrice,
  idealGasPriceInGwei,
  nextSpeed,
  setSpeed,
  speeds
};
