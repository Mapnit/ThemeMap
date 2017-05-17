
define([
  'dojo/_base/declare',
  'dojo/_base/lang',
  'dojo/_base/array',
  'dojo/_base/html',
  'jimu/BaseWidget',
  'dojo/on',
  'dojo/aspect',
  'dojo/string',
  'esri/layers/FeatureLayer',
  'esri/InfoTemplate', 
  'esri/Color', 
  'esri/symbols/SimpleLineSymbol', 
  'esri/symbols/SimpleFillSymbol', 
  'esri/SpatialReference',
  './ImageNode',
  './LayoutsContainer',
  'jimu/utils',
  'libs/storejs/store'
],
function(declare, lang, array, html, BaseWidget, on, aspect, string,
  FeatureLayer, InfoTemplate, Color, SimpleLineSymbol, SimpleFillSymbol, SpatialReference, 
  ImageNode, TileLayoutContainer, utils, store) {
  return declare([BaseWidget], {
    //these two properties is defined in the BaseWidget
    baseClass: 'lsg-widget-themeMap',
    name: 'ThemeMap',

    themes: [],
	
	currentIndex: -1, 
	currentLayer: null, 

    startup: function(){
      this.inherited(arguments);

      this.themeList = new TileLayoutContainer({
        itemSize: {width: 140, height: 92}, //image size is: 100*60,
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
	  if (this.currentLayer) {
		this.map.removeLayer(this.currentLayer); 
	  }
	  this.currentLayer = null; 
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
        label: theme.title
      });
      on(node.domNode, 'click', lang.hitch(this, lang.partial(this._onThemeClick, theme)));

      return node;
    },

    _onThemeClick: function(theme) {
      array.some(this.themes, function(b, i){
        if(b.title === theme.title){
          this.currentIndex = i;
          return true;
        }
      }, this);
	  
	  // remove the current layer
	  if (this.currentLayer) {
	    this.map.removeLayer(this.currentLayer); 
	    this.currentLayer = null;
	  }

	  // create a new theme
	  this.currentLayer = new FeatureLayer(theme.layerUrl, {
		name: theme.title, 
        outFields: ["*"], 
		mode: FeatureLayer.MODE_ONDEMAND
      });
	  
	  on(this.currentLayer, 'load', lang.hitch(this, lang.partial(this._displayThemeMap, theme))); 
	  
	}, 
	
	_displayThemeMap: function(theme) {
	  var defaultSymbol = new SimpleFillSymbol();
	  if (!theme.defaultStyle) {
		defaultSymbol.setColor(new Color([150, 150, 150, 0.5]));
		defaultSymbol.setOutline(
		  new SimpleLineSymbol().setWidth(0.1)
								.setColor(new Color([128,128,128]))
		); 
	  } else {
		defaultSymbol.setColor(Color.fromString(theme.defaultStyle.fillColor));
		defaultSymbol.setOutline(
		  new SimpleLineSymbol().setWidth(theme.defaultStyle.outlineWidth)
								.setColor(theme.defaultStyle.outlineColor)
		); 	
	  }
	
	  switch(theme.type) {
		case "range": 
		  this._displayMapAsClassBreaks(theme, defaultSymbol); 
		  break; 
		case "unique": 
		  this._displayMapAsUnqiueValues(theme, defaultSymbol); 
		  break;
		default: 
		  this._displayMapAsSingleTheme(defaultSymbol); 
	  }
	}, 
	
	_displayMapAsClassBreaks: function(theme, defaultSymbol) {
      //require the module on demand
	  require(['esri/renderers/ClassBreaksRenderer'], lang.hitch(this, function(ClassBreaksRenderer){
          var renderer = new ClassBreaksRenderer(defaultSymbol, theme.field);
		  array.forEach(theme.segments, lang.hitch(this, function(segment) {
		    var symbol = new SimpleFillSymbol();
            symbol.setColor(Color.fromString(segment.style.fillColor));
		    symbol.setOutline(
		      new SimpleLineSymbol().setWidth(segment.style.outlineWidth)
								    .setColor(Color.fromString(segment.style.outlineColor))
		    ); 
		    renderer.addBreak(
			  segment.min?segment.min:-Infinity, segment.max?segment.max:Infinity, 
			  symbol
		    ); 
		  })); 
		
		  this.currentLayer.setRenderer(renderer);
          this.map.addLayer(this.currentLayer);
        }));
	},  

	_displayMapAsUnqiueValues: function(theme, defaultSymbol) {
	  require(['esri/renderers/UniqueValueRenderer'], lang.hitch(this, function(UniqueValueRenderer){
		  var renderer = new UniqueValueRenderer(defaultSymbol, theme.field);
		  array.forEach(theme.segments, lang.hitch(this, function(segment) {
		    var symbol = new SimpleFillSymbol();
            symbol.setColor(Color.fromString(segment.style.fillColor));
		    symbol.setOutline(
		      new SimpleLineSymbol().setWidth(segment.style.outlineWidth)
								    .setColor(Color.fromString(segment.style.outlineColor))
		    ); 
		    renderer.addValue(
			  segment.value, 
			  symbol
		    ); 
		  })); 
		  
		  this.currentLayer.setRenderer(renderer);
          this.map.addLayer(this.currentLayer);		
	    }));
	}, 
	
	_displayMapAsSingleTheme: function(symbol) {
	  require(['esri/renderers/SimpleRenderer'], lang.hitch(this, function(SimpleRenderer){
		var renderer = new SimpleRenderer(symbol); 
		
		this.currentLayer.setRenderer(renderer);
        this.map.addLayer(this.currentLayer);
	  }));
	}
  });
});