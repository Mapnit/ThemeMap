
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'jimu/BaseWidget',
  'dojo/on',
  'dojo/aspect',
  'dojo/string',
  'esri/SpatialReference',
  './ImageNode',
  './LayoutsContainer',
  'jimu/utils',
  'libs/storejs/store'
],
function(declare, lang, array, html, BaseWidget, on, aspect, string,
  SpatialReference, ImageNode, TileLayoutContainer, utils, store) {
  return declare([BaseWidget], {
    //these two properties is defined in the BaseWidget
    baseClass: 'lsg-widget-themeMap',
    name: 'Bookmark',

    //bookmarks: Object[]
    //    all of the bookmarks, the format is the same as the config.json
    themes: [],

    startup: function(){
      // summary:
      //    this function will be called when widget is started.
      // description:
      //    see dojo's dijit life cycle.
      this.inherited(arguments);

      this.themeList = new TileLayoutContainer({
        itemSize: {width: 160, height: 92}, //image size is: 100*60,
        hmargin: 15,
        vmargin: 5
      }, this.themeListNode);

      this.themeList.startup();

    },

    onOpen: function(){
	  this.themes = lang.clone(this.config.themes); 
      this.displayThemes();
    },

    onClose: function(){
      this.themes = [];
	  this.currentIndex = -1;
    },

    onMinimize: function(){
      this.resize();
    },

    onMaximize: function(){
      this.resize();
    },

    resize: function(){
      if(this.themeList){
        this.themeList.resize();
      }
    },

    destroy: function(){
      this.themeList.destroy();
      this.inherited(arguments);
    },

    displayThemes: function() {
      var items = [];
      this.themeList.empty();
	  
      array.forEach(this.themes, function(theme) {
        items.push(this._createThemeNode(theme));
      }, this);

      this.themeList.addItems(items);

      this.resize();
    },

    _createThemeNode: function(theme) {
      var thumbnail, node;

      if(theme.thumbnail){
        thumbnail = utils.processUrlInWidgetConfig(theme.thumbnail, this.folderUrl);
      }else{
        thumbnail = this.folderUrl + 'images/thumbnail_default.png';
      }

      node = new ImageNode({
        img: thumbnail,
        label: theme.displayName
      });
      on(node.domNode, 'click', lang.hitch(this, lang.partial(this._onThemeClick, theme)));

      return node;
    },

    _onThemeClick: function(theme) {
      // summary:
      //    set the map extent or camera, depends on it's 2D/3D map
      array.some(this.themes, function(b, i){
        if(b.displayName === theme.displayName){
          this.currentIndex = i;
          return true;
        }
      }, this);

      //require the module on demand


  });
});