import logo from './logo.svg';
import './App.css';
import { render } from '@testing-library/react';
import React, { useState, useEffect } from 'react';
import L from 'leaflet';
import Axios from 'axios';
import axios from 'axios';

import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { makeStyles } from '@material-ui/core/styles';
import DeleteIcon from '@material-ui/icons/Delete';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import KeyboardVoiceIcon from '@material-ui/icons/KeyboardVoice';
import Icon from '@material-ui/core/Icon';
import SaveIcon from '@material-ui/icons/Save';

function getRevenueColor(rP) {
  return rP > 80 ? '#238b45' :
         rP > 50  ? '#74c476' :
         rP > 20  ? '#bae4b3' :
                    '#edf8e9';
}

function getAcquisitionColor(uAP) {
  return uAP > 80 ? '#fef0d9' :
         uAP > 50  ? '#fdcc8a' :
         uAP > 20  ? '#fc8d59' :
                    '#d7301f';
}

function getRatioColor(sP) {
  return sP > 110 ? '#7a0177' :
         sP > 90  ? '#c51b8a' :
         sP > 60  ? '#f768a1' :
         sP > 30  ? '#fbb4b9' :
                    '#feebe2';
}




const useStyles = makeStyles((theme) => ({
  button: {
    margin: theme.spacing(1),
    fontWeight: 700,
    fontSize: '2rem!important'
  },
  icon: {
    fontWeight: 700,
    fontSize: '2rem!important'
  }
}));


function revenueStyle(feature) {

  return {
      fillColor: getRevenueColor(feature.properties.revenuePercentage),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
  };
}

function acquisitionStyle(feature) {

  return {
      fillColor: getAcquisitionColor(feature.properties.userAcquisition),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
  };
}

function ratioStyle(feature) {

  return {
      fillColor: getRatioColor(feature.properties.sexRatio),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
  };
}

const App = () => {
  const classes = useStyles();

  const [areas, setAreas] = useState(null);
  // const [properties, setproperties] = useState(null);
  const [users, setUsers] = useState(null);

  const [revenue, setRevenue] = useState(true);
  const [acquisition, setAcquisition] = useState(false);
  const [ratio, setRatio] = useState(false);

  useEffect(() => {

    if(areas == null) {
      //  Fetch areas
      axios.get('https://kyupid-api.vercel.app/api/areas')
      .then((res) => {
        // let coordinatesArr = [];
        // let propArr = [];
        // res.data.features.forEach((feature) => {
        //   coordinatesArr.push(feature.geometry.coordinates[0])
        //   propArr.push(feature.properties)
        // })

        

        setAreas(res.data);
        // setproperties(propArr);
      })
      .catch((err) => {
        console.log(err)
      })
    }
    
    console.log(areas)
    
  });

  useEffect(() => {

    if(users == null) {
      //  Fetch areas
      axios.get('https://kyupid-api.vercel.app/api/users')
      .then((res) => {
        // let coordinatesArr = [];
        // res.data.features.forEach((feature) => {
        //   coordinatesArr.push(feature.geometry.coordinates[0])
        // })
        setUsers(res.data.users);
      })
      .catch((err) => {
        console.log(err)
      })
    }
    
    console.log(users)
    
  });

  useEffect(() => {
    let areasArr;

    if(!areasArr && areas && users) {
      let areasTemp = areas;
      areasArr = [];
      areas.features.forEach((feature) => {
        areasArr.push(feature.properties.area_id);
      })

      areasTemp.features.forEach((feature, i) => {
        areasTemp.features[i].properties.pro = 0;
        areasTemp.features[i].properties.total = 0;
        areasTemp.features[i].properties.males = 0;
        areasTemp.features[i].properties.females = 0;
      })
      
      let r=0;
      let totals = [0];
      users.forEach((user, i) => {
        let index = areasArr.indexOf(+user.area_id);
        if(user.is_pro_user)
          areasTemp.features[index].properties.pro++;
        
        if(user.gender == 'M')
          areasTemp.features[index].properties.males++;
        else if(user.gender == 'F')
          areasTemp.features[index].properties.females++;
        
        
        totals[index] = ++areasTemp.features[index].properties.total;
      })
      
      
      totals.sort();
      console.log('totalsBefore')
      console.log(totals)
      totals.sort();
      console.log('totals')
      console.log(totals)

      areasTemp.features.forEach((feature, i) => {
        if(areasTemp.features[i].properties.total != 0)
          areasTemp.features[i].properties.revenuePercentage = (areasTemp.features[i].properties.pro / areasTemp.features[i].properties.total) * 100;
        else
          areasTemp.features[i].properties.revenuePercentage = 0;
        
        if(areasTemp.features[i].properties.females != 0)
          areasTemp.features[i].properties.sexRatio = (areasTemp.features[i].properties.males / areasTemp.features[i].properties.females) * 100;
        else
          areasTemp.features[i].properties.sexRatio = 0;
        
        areasTemp.features[i].properties.userAcquisition = ( (totals.indexOf(areasTemp.features[i].properties.total) / (totals.length-1)) * 100 )
      })

      setAreas(areasTemp);
    }
    console.log('updated 1')
    console.log(areas)
  })

  useEffect(() => {
    let mymap;

    if(!mymap && areas) {

      if(mymap != undefined) {
        mymap.remove()
        mymap.remove()
      }
        
      let container = L.DomUtil.get('mapid');
      if(container != null){
        container._leaflet_id = null;
      }

      mymap = L.map('mapid').setView([12.905, 77.58], 13);

      L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1Ijoiai1qYXNwcmVldG1haHUiLCJhIjoiY2tteGlkcmF5MHA1ejJ2dXRlMDAyc2RsaiJ9._FFtuUs9qyLiPbijd622tg', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
          maxZoom: 18,
          id: 'mapbox/streets-v11',
          tileSize: 512,
          zoomOffset: -1,
          accessToken: 'your.mapbox.access.token'
      }).addTo(mymap);

      /////////////////////////////
      ////   PopUp ////////////////
      const onEachRevFeature = (feature, layer) => {
        let popupContent;
        if (feature.properties && feature.properties.name) {
          popupContent = `
          <b>${feature.properties.name} <br>
            <center>${Math.round(feature.properties.revenuePercentage)}</center>
          </b>
          `;
        }
    
        layer.bindPopup(popupContent);
      }

      const onEachAcqFeature = (feature, layer) => {
        let popupContent;
        if (feature.properties && feature.properties.name) {
          popupContent = `
          <b>${feature.properties.name} <br>
            <center>${Math.round(feature.properties.userAcquisition)}</center>
          </b>
          `;
        }
    
        layer.bindPopup(popupContent);
      }

      const onEachRatioFeature = (feature, layer) => {
        let popupContent;
        if (feature.properties && feature.properties.name) {
          popupContent = `
          <b>${feature.properties.name} <br>
            <center>${Math.round(feature.properties.sexRatio)}</center>
          </b>
          `;
        }
    
        layer.bindPopup(popupContent);
      }
    
      
      /////////////////////////////

      
      let geojson;
      if(revenue) {
        // L.geoJson(areas, {style: revenueStyle}).addTo(mymap);
        geojson = L.geoJSON(areas, {
    
          style: revenueStyle,
      
          onEachFeature: onEachRevFeature
        }).addTo(mymap);

        // setgeoJson(gJ)
      }      
      else if(acquisition) {
        geojson = L.geoJSON(areas, {
    
          style: acquisitionStyle,
      
          onEachFeature: onEachAcqFeature
        }).addTo(mymap);

      }
      else if(ratio) {
        geojson = L.geoJSON(areas, {
    
          style: ratioStyle,
      
          onEachFeature: onEachRatioFeature
        }).addTo(mymap);

      } 

      let info = L.control();
      // setInfo(info)

      function highlightFeature(e) {
        var layer = e.target;
      
        layer.setStyle({
            weight: 5,
            color: '#666',
            dashArray: '',
            fillOpacity: 0.7
        });
      
        if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
            layer.bringToFront();
        }
      
        info.update(layer.feature.properties);
      }
      
      function resetHighlight(e) {
        geojson.resetStyle(e.target);
        info.update();
      }
      
      function zoomToFeature(e) {
        mymap.fitBounds(e.target.getBounds());
      }

      info.onAdd = function (mymap) {
          this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
          this.update();
          return this._div;
      };
      
      
      var legend = L.control({position: 'bottomright'});

      


      if(revenue) {
        // method that we will use to update the control based on feature properties passed
      info.update = function (props) {
        this._div.innerHTML = '<h1>Areas with good revenue (users who have opted in/paid for Pro features)</h1>' +  (props ?
            '<b>' + props.name + '</b><br />' + props.density + ' people / mi<sup>2</sup>'
            : 'Hover over a state');
    };

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 10, 20, 50, 100, 200, 500, 1000],
          labels = [];
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getRevenueColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
      }      
      else if(acquisition) {
        // method that we will use to update the control based on feature properties passed
      info.update = function (props) {
        this._div.innerHTML = '<h1>Areas which requires more user acquisition campaigns</h1>';
    };

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 10, 20, 50, 100, 200, 500, 1000],
          labels = [];
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getAcquisitionColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
      }
      else if(ratio) {
        // method that we will use to update the control based on feature properties passed
      info.update = function (props) {
        this._div.innerHTML = '<h1>Areas where ratio of males to females are off';
    };

    legend.onAdd = function (map) {

      var div = L.DomUtil.create('div', 'info legend'),
          grades = [0, 10, 20, 50, 100, 200, 500, 1000],
          labels = [];
      // loop through our density intervals and generate a label with a colored square for each interval
      for (var i = 0; i < grades.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getRatioColor(grades[i] + 1) + '"></i> ' +
            grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
    }

    return div;
};
      }
      
      
      info.addTo(mymap);

      legend.addTo(mymap);
          
      // let marker = L.marker([12.9, 77.58]).addTo(mymap);

      // let circle = L.circle([12.908, 77.54], {
      //     color: 'red',
      //     fillColor: '#f03',
      //     fillOpacity: 0.5,
      //     radius: 500
      // }).addTo(mymap);


      

      // // Add areas here
      // areas[0].forEach((area, i) => {
      //   let revCorrsArr = [];
      //   area.forEach((coordinates) => {
      //     revCorrsArr.push(coordinates.reverse())  
      //   })
      //   let polygon = L.polygon([
      //       ...revCorrsArr
      //   ]).addTo(mymap);

      //   console.log(properties)
        
      //   let mid = Math.floor( (revCorrsArr.length-1)/2 )
      //   console.log(mid)
        
      //   // console.log(revCorrsArr[mid])
      //   // let marker = L.marker(revCorrsArr[mid],revCorrsArr[mid][2]).addTo(mymap);
      //   polygon.bindPopup(areas[1][i].name);
      //   // console.log(revCorrsArr)
      //   // console.log([...revCorrsArr])
      // })

      // marker.bindPopup("<b>Hello world!</b><br>I am a popup.").openPopup();
      // circle.bindPopup("I am a circle.");
      // polygon.bindPopup("I am a polygon.");


      

      // var popup = L.popup()
      // .setLatLng([12.9, 77.58])
      // .setContent("I am a standalone popup.")
      // .openOn(mymap);
    }
  })

  
  

  return (
    <div className="App">

      

      <header className="App-header">
        <Grid container spacing={3} style={{height: '100vh'}}>
          
          <Grid item xs={3}>
            <div style={{
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: 'center',
                    height: '100%',
                    fontWeight: '700!important'
                  }}>
              <Button
                variant="contained"
                color="secondary"
                className={classes.button}
                // startIcon={<DeleteIcon style={{fontSize: '2rem'}}/>}
                onClick={() => {
                  setRevenue(true)
                  setAcquisition(false)
                  setRatio(false)
                }}
              >
                Revenue
              </Button>
              {/* This Button uses a Font Icon, see the installation instructions in the Icon component docs. */}
              <Button
                variant="contained"
                color="primary"
                className={classes.button}
                // endIcon={<Icon>send</Icon>}
                onClick={() => {
                  setRevenue(false)
                  setAcquisition(true)
                  setRatio(false)
                }}
              >
                Acquisition
              </Button>
              <Button
                variant="contained"
                color="default"
                className={classes.button}
                // startIcon={<CloudUploadIcon />}
                onClick={() => {
                  setRevenue(false)
                  setAcquisition(false)
                  setRatio(true)
                }}
              >
                Ratio
              </Button>
              
            </div>
          </Grid>
          
          <Grid item xs={9}>
            <div 
              id="mapid"
              style={{ height: '100%', width: '100%'}}>  
            </div>
          </Grid>
        </Grid>
      </header>
    </div>
  );
}

export default App;