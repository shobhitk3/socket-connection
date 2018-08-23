/*
 * To define the route for apis
 */
require('../module');

// from here all the routing will handle and provide proper controller and models to them
exports.apply = function (app){

    app.all('*',$.setMyViews);

    app.get('/',$.controller('home').index);
};
