'use strict';
var csv = require('csv');
var fs = require('fs');

var readMarketData = function(fileName, arrData1, arrData2, arrData3) {
  return new Promise((resolve) => {
    csv()
    .from.stream(fs.createReadStream(__dirname + '/../data/mall_id/' + fileName))
    .to.path(__dirname + '/sample.csv')
    .on('record', function (row, index) {
      if (row[0] != 'shop_id') {
        var row1 = parseFloat((row[2] - 122.346) * 500000);
        var row2 = parseFloat((row[3] - 31.833) * 300000 - 120);
        var shop_id = row[0];
        var price = row[4];
        arrData1.push([row1,row2]);
        arrData2.push(price);
        arrData3.push(shop_id);       
      }
    })
    .on('close', function (count) {
        console.log(count);
        resolve();
    })
    .on('error', function (error) {
      console.log(error);
    });
  }); 
}


function readBuyData (fileName){
  return new Promise((resolve,reject)=>{
    let arrData = []
    csv()
    .from.stream(fs.createReadStream(__dirname + '/../data/user_mall_id_day/'+ fileName))
    .to.path(__dirname + '/sample.csv')
    .on('record', function (row, index) {
      if (row[0] != 'shop_id') {
        var row1 = parseFloat((row[3] - 122.346) * 500000);
        var row2 = parseFloat((row[4] - 31.833) * 300000 - 120);
        arrData.push([row1,row2]);
      }
    })
    .on('close', function (count) {
      console.log(count);      
      resolve(arrData);
    })
    .on('error', function (error) {
      reject(error)
    });
  })
}

//获得所选店铺数组的时间区间，返回有人流数据的最早时间和最晚时间
function getTimeRange (day, marketName, shopNames){
  return new Promise((resolve, reject) => {
    let timeArray = [];
    let shops = [];
    csv()
    .from.stream(fs.createReadStream(__dirname + '/../data/user_mall_id_day/'+ day  + "_" + marketName))
    .to.path(__dirname + '/sample.csv')
    .on('record', function (row, index) {
      if(row[1]!='shop_id') {
        if(shops.indexOf(row[1]) == -1) {
          shops.push(row[1]);
        }
        if (shopNames.indexOf(row[1]) != -1) {
          timeArray.push(row[2].split(" ")[1]);
        }
      }
      
    })
    .on('close', function (count) {
      console.log(count);
      console.log(shops);
      var timeMax = Math.max.apply(null, timeArray.map( function(d) {
        return d.split(":")[0];
      }));
      var timeMin =  Math.min.apply(null, timeArray.map( function(d) {
        return d.split(":")[0];
      }));    
      resolve({
        timeMax : timeMax,
        timeMin : timeMin,
        shops:shops
      });
    })
    .on('error', function (error) {
      reject(error)
    });
  })
}

//获取特定店铺在所有时间区间内的人流量
//若没有则填充0（因为可能一个时间区间内，有的店铺有人流，有的店铺没有人流）
function getShopFlow (day, marketName, shopName, arrTime){
  return new Promise((resolve, reject) => {
    let arrManCount = [];
    for(let x = 0;x < arrTime.length;x++) {
      arrManCount.push(0);
    }
    csv()
    .from.stream(fs.createReadStream(__dirname + '/../data/user_mall_id_day/'+ day  + "_" + marketName))
    .to.path(__dirname + '/sample.csv')
    .on('record', function (row, index) {
      if (row[1] == shopName) {
        let time = parseInt(row[2].split(" ")[1].split(":")[0]);
        let index = arrTime.indexOf(time);
        arrManCount[index]++;
      }
    })
    .on('close', function (count) {
      resolve(arrManCount);
    })
    .on('error', function (error) {
      reject(error)
    });
  })
}

var getDataController = async function (req, res) {
  try {
    var arrData = [];
    var arrPrice = [];
    var arrPos = [];
    var arrPos1 = [];
    var arrShopid = [];    
    await readMarketData('m_690.csv', arrData, arrPrice, arrShopid);
    var readDir = fs.readdirSync(__dirname + '/../data/user_mall_id_day/')
    for(var i = 0;i < readDir.length;i++){
      let arrPos1 = await readBuyData(readDir[i]).catch(err=>{console.error(err)});
      arrPos.push(arrPos1);
    }
    res.render('index', { arrData: arrData, arrPrice: arrPrice, arrPos: arrPos, arrShopid: arrShopid});
  } catch (error) {
    res.render('error',{msg:error});
  }
};

var getBarController = function (req, res) {
  res.render('barChart');
};

var getBarDataController = async function (req, res) {
  try {
    var shopName = req.body.shopName;
    var day = req.body.day;
    var shopFlow = [];
    var arrTime = [];
    var timeLegend = [];
    var timeRange = await getTimeRange(day, "m_690.csv", shopName);
    var tMax = timeRange.timeMax,
      tMin = timeRange.timeMin;
  
    for(let t = tMin;t<=tMax;t++) {
      timeLegend.push(t + ":00");
    }
    for(let t = tMin;t<=tMax;t++) {
      arrTime.push(t);
    }
  
    for(let s = 0;s < shopName.length;s++) {
      var sFlow = await getShopFlow (day, "m_690.csv", shopName[s], arrTime)
      shopFlow.push(sFlow)
    }
    
    res.json({
      status:"ok",
      result:{
        timeRange:timeRange, 
        timeLegend: timeLegend,
        shopFlow: shopFlow
      }
    });

  } catch (error) {
    res.json({
      status:"err",
      result:error
    });
}
};


module.exports = {
  getData: getDataController,
  getBar: getBarController,
  getBarData: getBarDataController
};
