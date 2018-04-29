var miio = require('miio');
var Service, Characteristic;
var devices = [];

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-mi-plug', 'MiPlug', MiPlug);
}

function MiPlug(log, config) {
	this.log = log;
	this.ip = config.ip;
	this.token = config.token;
	this.name = config.name || 'Mi Plug';

	this.services = [];

	if(!this.ip)
		throw new Error('Your must provide IP address of the Plug.');

	if(!this.token)
		throw new Error('Your must provide token of the Plug.');


	// Register the service
 	this.service = new Service.Switch(this.name);

	this.service
		.getCharacteristic(Characteristic.Active)
		.on('get', this.getActive.bind(this))
		.on('set', this.setActive.bind(this));

	this.service
		.getCharacteristic(Characteristic.LockPhysicalControls)
		.on('get', this.getLockPhysicalControls.bind(this))
		.on('set', this.setLockPhysicalControls.bind(this));

	// Service information
	this.serviceInfo = new Service.AccessoryInformation();

	this.serviceInfo
		.setCharacteristic(Characteristic.Manufacturer, 'Xiaomi')
		.setCharacteristic(Characteristic.Model, 'MiPlug')
		.setCharacteristic(Characteristic.SerialNumber, 'Undefined');

	this.services.push(this.service);
	this.services.push(this.serviceInfo);
	
	this.discover();
}

MiPlug.prototype = {
	discover: function(){
		miio.device({ address: this.ip, token: this.token })
		.then(device => {
				this.device = device;
		})
		.catch(err => {
			console.log('ERROR: ', err);
		});
	},

	getActive: function(callback) {
		this.device.call('get_prop', ['mode'])
			.then(result => {
				callback(null, (result[0] === 'idle') ? Characteristic.Active.INACTIVE: Characteristic.Active.ACTIVE);
            }).catch(err => {
				callback(err);
			});
	},

	setActive: function(state, callback) {
		this.device.call('set_power', [(state) ? 'on' : 'off'])
			.then(result => {
				(result[0] === 'ok') ? callback() : callback(new Error(result[0]));
			})
			.catch(err => {
				callback(err);
			});
	},

	

	getLockPhysicalControls: function(callback) {
		this.device.call('get_prop', ['child_lock'])
			.then(result => {
				callback(null, result[0] === 'on' ? Characteristic.LockPhysicalControls.CONTROL_LOCK_ENABLED : Characteristic.LockPhysicalControls.CONTROL_LOCK_DISABLED);
			})
			.catch(err => {
				callback(err);
			});
	},

	setLockPhysicalControls: function(state, callback) {
		this.device.call('set_child_lock', [(state) ? 'on' : 'off'])
			.then(result => {
				(result[0] === 'ok') ? callback() : callback(new Error(result[0]));
			}).catch(err => {
				callback(err);
			});
	},

	identify: function(callback) {
		callback();
	},

	getServices: function() {
		return this.services;
	}
};