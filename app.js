const Electron = require('electron');
const Host = require("./main/host.js");
const Option = require("./main/option.js");
const Package = require('./package.json');

class App{
    constructor(){
        //check if we are in debug mode
        this.debug = process && process.env && process.env.DEBUG
        //get some Infomation
        this._name = Package.name;
        this._version = Package.version;

        //app Path
        this._appPath = Electron.app.getAppPath();
        //reader file path
        this._renderPath = `${this._appPath}/render`;

        //create all components
        this.Host = new Host(this);
        // this.option = new Option(this);

        //initialize the app
        this.initialize();
    }
    /**
    * Initialize app
    * @return {APP}
    */
    initialize(){
        // //bind handlers
        // this.option.on('save', (...arg) => this.optionSaveHandler(...arg));
        // //initialize all components
        // this.option.initialize();
        //initialize the panel
        this.Host.initialize();
        this.Host.show();
        return this;

    }
    /**
    * will call when option save
    */
    optionSaveHandler(option){

    }
}

module.exports = App;
