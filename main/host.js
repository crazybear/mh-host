const Electron = require('electron');
const Fs = require('fs');
const Path = require('path');
const Os = require('os');
const USER_DATA_PATH = Electron.app.getPath('userData');
class Panel {
    constructor(app){
        this._app = app;
        //group list
        this._groupListCache = [];
        //group list path
        this._groupOptionPath = Path.join(USER_DATA_PATH, 'groupOption.json');
        //group file path
        this._groupFileDir = Path.join(USER_DATA_PATH, 'group/');
        //host file path
        this._hostFilePath = Os.platform() == 'win32' ? 'C:/Windows/System32/drivers/etc/hosts': '/etc/hosts';
    }
    initialize(){
        //create the window
        this._win = this.createWindow();
        //try to read group path
        try{
            Fs.readdirSync(this._groupFileDir, 'utf8');
        }catch(e){
            //if group path isn't existent, make it
            Fs.mkdirSync(this._groupFileDir);
        }
        //try to read host file
        try{
            Fs.readFileSync(this._hostFilePath, 'utf8');
        }catch(e){
            //if host isn't existent, make it
            Fs.writeFileSync(this._hostFilePath, '');
        }
        this._groupListCache = this.getGroups();
        Electron.ipcMain.on('host.getGroups', (e) => (e.returnValue = this._groupListCache));
        Electron.ipcMain.on('host.readGroupFile', (e, id) => e.returnValue = this.readGroupFile(id));
        Electron.ipcMain.on('host.writeGroupFile', (e, id, data) => this.writeGroupFile(id, data));
        Electron.ipcMain.on('host.useGroupFile', (e, id) => e.returnValue = this.useGroupFile(id));
        Electron.ipcMain.on('host.createAddWindow', (e) => this.createAddWindow());
        Electron.ipcMain.on('host.addGroup', (e, option) => {
            this.addGroup(option.name);
            this._win.webContents.send('host.groupChanged');
        });
        Electron.ipcMain.on('host.deleteGroup', (e, option) => {
            let res = this.delGroup(option.id);
            this._win.webContents.send('host.groupChanged');
            e.returnValue = res;

        });
        return this;
    }
    /**
    * create the window
    * @rerturn {BrowserWindow}
    */
    createWindow(){
        let win = new Electron.BrowserWindow({
            title : this._app._name,
            show: false,
            width: 1040,
            height : 800,
            minWidth : 800,
            minHeight : 600,
            backgroundColor : '#fafafa'
        });


        win.loadURL(`file://${this._app._renderPath}/panel.html`);

        return win;
    }
    createAddWindow(){
        let win = new Electron.BrowserWindow({
            resizable : false,
            show: true,
            width: 500,
            height : 200,
            backgroundColor : '#fafafa'
        });
        win.loadURL(`file://${this._app._renderPath}/add.html`);
        win.once('ready-to-show', () => win.show());
        return win;
    }
    /**
    * show the window
    */
    show(){
        this._win.show();
        //debug
        //this._win.webContents.openDevTools();
    }
    getGroups(){
        try{
            let groups = Fs.readFileSync(this._groupOptionPath, 'utf8');
            return JSON.parse(groups);
        }catch(e){
            Fs.writeFileSync(this._groupOptionPath, '[]');
            //add current group
            this.addGroup('当前系统 host', 'current', 0);
            return this.getGroups();
        }
    }
    addGroup(
        name,
        filename = `_group_file_${name}`,
        id = `${new Date().getTime()}_${parseInt(Math.random() * 10)}`
    ){
        filename = `${filename}_${id}`;
        let option = {
            name : name,
            filename : filename,
            id : id
        }
        this._groupListCache.push(option);
        Fs.writeFileSync(Path.join(this._groupFileDir, filename), '');
        Fs.writeFileSync(this._groupOptionPath, JSON.stringify(this._groupListCache));
    }
    delGroup(id){
        if(id && id != 0){
            let change = false;
            let _groupListCache = this._groupListCache.filter((item) => {
                if(item.id == id){
                    change = true;
                    Fs.unlink(Path.join(this._groupFileDir, item.filename), ()=>{});
                }else{
                    return item;
                }
            });
            if(change){
                this._groupListCache = _groupListCache;
                Fs.writeFileSync(this._groupOptionPath, JSON.stringify(this._groupListCache));
            }
        }
        return {code : 0};
    }
    getGroupById(id){
        let item = this._groupListCache.filter(function(groupItem){
            if(groupItem.id == id){
                return groupItem;
            }
        });
        return item[0];
    }
    readGroupFile(id = 0){
        if(id == 0){
            return Fs.readFileSync(this._hostFilePath, 'utf8');
        }else{
            let item = this.getGroupById(id);
            return Fs.readFileSync(Path.join(this._groupFileDir, item.filename), 'utf8');
        }
    }
    writeGroupFile(id = 0, data = ''){
        if(id == 0 || !id){
            return Fs.writeFileSync(this._hostFilePath, data);
        }else{
            let item = this.getGroupById(id);
            return Fs.writeFileSync(Path.join(this._groupFileDir, item.filename), data);
        }
    }
    useGroupFile(id = 0){
        if(id == 0){
            return {code : 0, msg : 'is current host'};
        }else{
            let item = this.getGroupById(id);
            try{
                let file = Fs.readFileSync(Path.join(this._groupFileDir, item.filename), 'utf8');
                Fs.writeFileSync(this._hostFilePath, file);
                return {code : 0, msg : 'success'};
            }catch(e){
                return {code : -1, msg : 'error'};
            }
        }
    }
}

module.exports = Panel;
