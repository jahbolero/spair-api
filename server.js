var express = require('express');
var app = express();
var https = require('https');
var request = require('request-promise');
var bodyParser = require('body-parser');
var port = process.env.PORT|| 8080
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var stopper = 0;
var flightNumbers = [
{
	"flightCode":"SQ",
	"flightNumber":"26",

},
{
	"flightCode":"SQ",
	"flightNumber":"968",

},
{
	"flightCode":"MI",
	"flightNumber":"561",
}
];

var flightClass = {
	"flightNumber":"null",
	"flightCode":"",
	"flightStatus":"null",
	"scheduledDepartureTime":"null",
	"provisionalEtd":"null",
	"boardingGate":"null",
	"isBoarding":"false"
};

var obj = {
	flights:[{
		"flightNumber":"",
		"flightCode":"",
		"scheduledDepartureTime":"",
		"flightStatus":"",
		"provisionalEtd":"",
		"boardingGate":"",
		"isBoarding":""
	}]
}

var flightArray = {
	flights:[{
	}]
};


/*
"flightNumber":"0026",
	"flightCode":"SQ",
	"scheduledDepartureTime":"2019-08-19T06:20",
	"flightStatus":"On Schedule",
	"provisionalEtd":"null",
	"boardingGate":"5",
	"isBoarding":"false"

	},
	{
	"flightNumber":"0950",
	"flightCode":"SQ",
	"scheduledDepartureTime":"2019-08-19T15:20",
	"flightStatus":"Delayed",
	"provisionalEtd":"2019-08-19T17:20",
	"boardingGate":"21",
	"isBoarding":"true"

*/

async function getByNumber(index){
	if(flightNumbers[index]){
		var date = new Date();
		var year = date.getFullYear();
		var day = date.getDate();
		var month = ("0" + (date.getMonth() + 1)).slice(-2);
		console.log(`${year}-${month}-${day}`)
		const data1 = JSON.stringify({
				  "request":{
				    "airlineCode":flightNumbers[index].flightCode,
				    "flightNumber":flightNumbers[index].flightNumber,
				    // "originAirportCode":"SIN",
				    "scheduledDepartureDate":`${year}-${month}-${day}`,
				    // "destinationAirportCode":"CGK",
				    // "scheduledArrivalDate":"2019-01-17"
				  },
				  "clientUUID":"TestIODocs"
				});
		
		var options = {
			method: 'POST',
			uri:'https://apigw.singaporeair.com/api/v3/flightstatus/getbynumber',
			headers: {
				'Content-Type':'application/json',
				'Content-Length': data1.length,
				'apikey': 'q2puvu9k4xe9mgg48q9d4t3s',
				'X-Originating-IP': '49.151.40.209'
			},
			body:{
				  "request":{
				    "airlineCode":flightNumbers[index].flightCode,
				    "flightNumber":flightNumbers[index].flightNumber,
				    // "originAirportCode":"SIN",
				    "scheduledDepartureDate":`${year}-${month}-${day}`,
				    // "destinationAirportCode":"CGK",
				    // "scheduledArrivalDate":"2019-01-17"
				  },
				  "clientUUID":"TestIODocs"
				}
			,
			json:true
		};

		var something = request(options).then(function(parsedBody){
			return parsedBody;
		}).catch(function(err){
			console.log("Parse errors:" +err);
		});

		return something;
	}		
}

async function wait(ms){
	return new Promise(resolve=>{
		setTimeout(resolve,ms);
	})
}
app.get("/start",function(req,res){

	stopper = 0;
	var y = 1;
	async function initialize(){
		var chk = 0;
		var arrChk;
		while(!arrChk && stopper == 0){
			console.log("Stopper is: " +stopper);
			for(var i = 0; i < flightNumbers.length;){
				if(i == 0){
					obj.flights = [];
					y--;
				}

				//////Due to API Restrictions, we deviced a way to delay API calls////
				await wait(5000*(i+1));
				if(y < 1){
					getByNumber(i).then(function(val){
						if(val != null && val.status == "SUCCESS"){
							var fclass = {"flightNumber":"","flightCode":"", "flightStatus":"", "provisionalEtd":"null","scheduledDepartureTime":"","boardingGate":"null","isBoarding":"false"};
							fclass.flightNumber = val.response.flights[0].legs[0].flightNumber;
							fclass.flightCode = val.response.flights[0].legs[0].operatingAirlineCode;
							fclass.flightStatus = val.response.flights[0].legs[0].flightStatus;

							if(val.response.flights[0].legs[0].estimatedDepartureTime){
								fclass.provisionalEtd = val.response.flights[0].legs[0].estimatedDepartureTime;	
							}
							
							fclass.scheduledDepartureTime = val.response.flights[0].legs[0].scheduledDepartureTime;
							
							console.log("fclass " + JSON.stringify(fclass));

							obj.flights.push(fclass);

							if(flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber)){
								flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).flightStatus = val.response.flights[0].legs[0].flightStatus;
								
								if(val.response.flights[0].legs[0].estimatedDepartureTime){
									flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).provisionalEtd = val.response.flights[0].legs[0].estimatedDepartureTime;
								}
								
								flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).scheduledDepartureTime = val.response.flights[0].legs[0].scheduledDepartureTime;
								console.log("(inside if) FlightArray so far: " + JSON.stringify(flightArray));
							}else if(flightArray.flights.length == 1 && i == flightNumbers.length - 1){
								for(var ind = 0; ind < obj.flights.length;){
									flightArray.flights.push(obj.flights[ind]);
									ind++;
								}

								console.log("(inside else if) FlightArray is: " +JSON.stringify(flightArray));
							}
						}else{
							arrChk = val;
						}

						 i++;
					});	
				}		
			}	
		}

		if(arrChk){
			console.log("Error. Array is: " + JSON.stringify(arrChk));
		}
	}

	initialize();	
})

app.post('/getNumber', function(req, res){
	console.log("Getting Flight Details");
	console.log(flightArray);	
	var myFlight = flightArray.flights.find(x=> x.flightCode == req.body.flightCode && x. flightNumber == req.body.flightNumber);
	console.log("MyFlight:"+myFlight);
	res.send(myFlight);
});

app.listen(port);


///CLYDE
app.post("/updateTerminal",function(req,res){
console.log("Bodehhh" +JSON.stringify(req.body));
req.body.flightCode = req.body.flightCode.trim();
console.log(flightArray);
var flight = flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode);
console.log("asd");
console.log(flight);
if(flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode)){
	console.log("exist");
	flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode).boardingGate = req.body.boardingGate;
	flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode).isBoarding = req.body.isBoarding;

	var flight = flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode);
	console.log(flight);
	res.send(flight)
}else{
	res.send("FLIGHT NOT FOUND");
}

})


app.get('/stopper', function(req, res){
	stopper++;
	console.log("Stopping...");
	res.send("Stopping...");
});

app.post('/flightDetails',function(req,res){
	var flight = flightArray.flights.find(x=> x.flightNumber == req.body.flightNumber && x.flightCode == req.body.flightCode);
	console.log("fdsfndsjf0");
	console.log("Flight here:" +JSON.stringify(flight));
	if(flight != null){
		
		res.send(flight);
	}else{
		res.send("FLIGHT NOT FOUND");
	}
});




app.post("/tester",function(req,res){
	console.log("HERE");
	res.send("data");
})

app.get('/serverCheck',function(req,res){

	console.log(flightArray);
	res.send(flightArray);
})

app.get('/pullOnce',function(req,res){

	var y = 1;
	async function initialize(){
			for(var i = 0; i < flightNumbers.length;){
				if(i == 0){
					obj.flights = [];
					y--;
				}

				//////Due to API Restrictions, we deviced a way to delay API calls////
				await wait(5000*(i+1));
				if(y < 1){
					getByNumber(i).then(function(val){
						if(val != null && val.status == "SUCCESS"){
							var fclass = {"flightNumber":"","flightCode":"", "flightStatus":"", "provisionalEtd":"","scheduledDepartureTime":"","boardingGate":"null","isBoarding":"false"};
						fclass.flightNumber = val.response.flights[0].legs[0].flightNumber;
						fclass.flightCode = val.response.flights[0].legs[0].operatingAirlineCode;
						fclass.flightStatus = val.response.flights[0].legs[0].flightStatus;
						fclass.provisionalEtd = val.response.flights[0].legs[0].estimatedDepartureTime;
						fclass.scheduledDepartureTime = val.response.flights[0].legs[0].scheduledDepartureTime
						console.log("fclass " + JSON.stringify(fclass));

							obj.flights.push(fclass);

							if(flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber) ){
								flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).flightStatus = val.response.flights[0].legs[0].flightStatus;
							flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).provisionalEtd = val.response.flights[0].legs[0].estimatedDepartureTime;
							flightArray.flights.find(x=> x.flightNumber == val.response.flights[0].legs[0].flightNumber).scheduledDepartureTime = val.response.flights[0].legs[0].scheduledDepartureTime;
							console.log("(inside if) FlightArray so far: " + JSON.stringify(flightArray));
							}else if(flightArray.flights.length == 1 && i == flightNumbers.length - 1){
								for(var ind = 0; ind < obj.flights.length;){
									flightArray.flights.push(obj.flights[ind]);
									ind++;
								}

								console.log("(inside else if) FlightArray is: " +JSON.stringify(flightArray));
							}
						}else{
							arrChk = val;
						}

						 i++;
					});	
				}		
			}	
	}

	initialize();
	res.send("Pulling")
})

app.get('/', function(req, res) {
  res.render('home.ejs');
});
