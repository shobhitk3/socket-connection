
 module.exports = {

    index: function (req, res) {

      let response ={
          title : 'Video Conferencing',
          error : false,
          errorMsg : '',
          confStatus:false,
          participant_type : "P",
          participant_conf_id : 0,
          defMsg : 'Welcome to video conferencing'
        };
      res.render('home/index', response);
    }
};
