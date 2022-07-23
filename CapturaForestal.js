// Stellar Bytes


var dataset2000 = ee.ImageCollection('MODIS/006/MOD44B').filter(ee.Filter.date('2000-01-01', '2000-12-31'));
var dataset = ee.ImageCollection('MODIS/006/MOD44B').filter(ee.Filter.date('2018-01-01', '2018-12-31'));


function calculateForest(region){
  var sumTree = calculaPerYear(region, dataset);
  var sumTree2000 = calculaPerYear(region, dataset2000);
  
  var forestacion = ee.String(ee.Number(sumTree).divide(ee.Number(sumTree2000)));
  
  var prueba = forestacion;
    
  print(forestacion);
}

function calculaPerYear(region, data){
  
  var merged = data.toBands();
  
  var nameBand = merged.bandNames().getInfo()[0];
  
  var pixelsDict = merged
    .select([merged.bandNames().getInfo()[0]])
    .addBands(ee.Image.pixelLonLat()).reduceRegion({
    reducer: ee.Reducer.toList(), 
    geometry: region, 
    scale: 50000
  });
  
  var bandNames = pixelsDict.keys();
  

var pixels = ee.Array(pixelsDict.values()).transpose().toList();

var table = ee.FeatureCollection(
  pixels.map(function (bandValues) {

    var properties = ee.Dictionary.fromLists(
      bandNames, ee.Array(bandValues).toList()
    )

        var geometry = ee.Geometry.Point(
          properties.getNumber('longitude'),
          properties.getNumber('latitude')
        )
        return ee.Feature(geometry, properties)
      })  
    );
    
    var sumTree = table.aggregate_sum(nameBand);
    
    return sumTree
}


var layerProperties = {
  '2019': {
    name: 'Percent_Tree_Cover',
    visParams: {min: 0, max: 100.0, palette: ['bbe029', '0a9501', '074b03', 'blue']},
    legend: [
      {'0-25': 'bbe029'}, {'26-50': '0a9501'}, {'51-75': '074b03'},
      {'76-100': 'blue'}
    ],
    defaultVisibility: true
  }
};

var mapPanel = ui.Map();
mapPanel.drawingTools().getShown();
mapPanel.setZoom(7);
ui.root.widgets().reset([mapPanel]);
ui.root.setLayout(ui.Panel.Layout.flow('horizontal'));


for (var key in layerProperties) {
  var layer = layerProperties[key];
  var image = dataset;
  mapPanel.add(ui.Map.Layer(image,{}, key, layer.defaultVisibility));
}

var header = ui.Label('Cálculo de captura de carbono para mejorar el medio Ambiente', {fontSize: '26px', color: 'green', textAlign : 'center'});
var text = ui.Label(
    '',
    {fontSize: '11px'});

var toolPanel = ui.Panel([header, text], 'flow', {width: '300px'});
ui.root.widgets().add(toolPanel);

var selectItems = Object.keys(layerProperties);

var layerSelect = ui.Select({
  items: selectItems,
  value: selectItems[0],
  onChange: function(selected) {
    mapPanel.layers().forEach(function(element, index) {
      element.setShown(selected == element.getName());
    });
    setLegend(layerProperties[selected].legend);
  }
});

toolPanel.add(ui.Label('Ver por año', {'font-size': '24px'}));
toolPanel.add(layerSelect);

var legendPanel = ui.Panel({
  style:
      {fontWeight: 'bold', fontSize: '10px', margin: '0 0 0 8px', padding: '0'}
});
toolPanel.add(legendPanel);

var legendTitle = ui.Label(
    'Legend',
    {fontWeight: 'bold', fontSize: '10px', margin: '0 0 4px 0', padding: '0'});
legendPanel.add(legendTitle);

var keyPanel = ui.Panel();
legendPanel.add(keyPanel);

function setLegend(legend) {
  keyPanel.clear();
  for (var i = 0; i < legend.length; i++) {
    var item = legend[i];
    var name = Object.keys(item)[0];
    var color = item[name];
    var colorBox = ui.Label('', {
      backgroundColor: color,
      padding: '8px',
      margin: '0'
    });
    var description = ui.Label(name, {margin: '0 0 4px 6px'});
    keyPanel.add(
        ui.Panel([colorBox, description], ui.Panel.Layout.Flow('horizontal')));
  }
}

setLegend(layerProperties[layerSelect.getValue()].legend);

var checkbox = ui.Checkbox({
  label: 'Opacity',
  value: true,
  onChange: function(value) {
    var selected = layerSelect.getValue();

    mapPanel.layers().forEach(function(element, index) {
      element.setShown(selected == element.getName() ? value : false);
    });

    layerSelect.setDisabled(!value);
  }
});


var opacitySlider = ui.Slider({
  min: 0,
  max: 1,
  value: 1,
  step: 0.01,
});
opacitySlider.onSlide(function(value) {
  mapPanel.layers().forEach(function(element, index) {
    element.setOpacity(value);
  });
});

var viewPanel =
    ui.Panel([checkbox, opacitySlider], ui.Panel.Layout.Flow('horizontal'));
toolPanel.add(viewPanel);

mapPanel.drawingTools().onDraw(function (geometry) {
  calculateForest(geometry);
  Map.addLayer(geometry, null, 'a drawn geometry')
})
