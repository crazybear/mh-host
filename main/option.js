const path = require('path');
const os = require('os');
const Fs = require('fs');
const EventEmitter = require('events');
const Electron = require('electron');

class Option extends EventEmitter{
    constructor(app){
        super();

        this._app = app;

        //store the options
        this.option = {};
    }
    /**
    * Initialize option
    * @return {Option}
    */
    initialize(){
        //set default option
        this.set(this.getDeafultOptions());

        //load user option

        try{
            //try to read user option file
            var option = Fs.readFileSync(this.get('userOptionFilePath'), 'utf8');
            option = JSON.parse(option);
        }catch(e){
            //if can't find the file.
            //will save a new option file
            return this.save();
        }
        //mix user option
        option = Object.assign({}, this.get(), option);

        //set option
        this.set(option);

        //emit save to set app option
        this.emit('save', option);

        return this;

    }
    /**
    * get option
    * @param {string} key key of the options
    * @return {any}
    */
    get(key){
        if(typeof key == 'string'){
            return this._option[key];
        }
        return this._option;

    }
    /**
    * set option
    * @param {string | object} key of the options
    * @param {any} value option value
    */
    set(key, value){
        if(typeof key == 'object'){
            this._option = Object.assign({}, this.get(), key);
        }else{
            this._option[key] = value;
        }
    }
    /**
    * get the default option
    */
    getDeafultOptions(){
        return {
            hostFilePath : os.platform() == 'win32' ? 'C:/Windows/System32/drivers/etc/hosts': '/etc/hosts',
            userOptionFilePath : path.join(Electron.app.getPath('userData'), 'userOption.json')
        }
    }
    /**
    * save the option to disk
    */
    save(){
        let option = this.get();
        // Try writing option to disk
        Fs.writeFileSync(this.get('userOptionFilePath'), JSON.stringify(option));

        // Pass new preferences to app
        this.emit('save', option);
    }
}
module.exports = Option;
