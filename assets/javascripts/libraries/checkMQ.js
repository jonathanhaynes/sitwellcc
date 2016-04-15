(function(global,factory){if(typeof define==="function"&&define.amd){define(["exports"],factory)}else if(typeof exports!=="undefined"){factory(exports)}else{var mod={exports:{}};factory(mod.exports);global.checkMQ=mod.exports}})(this,function(exports){Object.defineProperty(exports,"__esModule",{value:true});exports.addFunctions=addFunctions;var theFunctions=[];var breakpoints=[{name:"mqCore",query:"screen and (max-width: 599px)"},{name:"mq600",query:"screen and (min-width: 600px) and (max-width: 767px)"},{name:"mq768",query:"screen and (min-width: 768px) and (max-width: 959px)"},{name:"mq960",query:"screen and (min-width: 960px) and (max-width: 1199px)"},{name:"mq1200",query:"screen and (min-width: 1200px)"}];var whichMQ=function whichMQ(breakpoint){var theMQ=undefined;if(window.matchMedia(breakpoint.query).matches){if(theMQ!==breakpoint.name){theMQ=breakpoint.name;loadFunctions(theMQ);return theMQ}}};var changeMQ=function changeMQ(){breakpoints.forEach(function(breakpoint,i){if(window.matchMedia(breakpoint.query).matches){whichMQ(breakpoint);window.matchMedia(breakpoint.query).addListener(function(){whichMQ(breakpoint)})}else{window.matchMedia(breakpoint.query).addListener(function(){whichMQ(breakpoint)})}})};var loadFunctions=function loadFunctions(theMQ){theFunctions.forEach(function(theFunction,i){theFunction(theMQ)})};function addFunctions(fns){fns.forEach(function(fn,i){theFunctions.push(fn);loadFunctions(whichMQ)});changeMQ()}});
