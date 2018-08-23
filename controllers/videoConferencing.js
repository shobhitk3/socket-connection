  const crypto = require('crypto'),
   dateformat = require('dateformat');

 module.exports = {

    index: function (req, res) {

      if(req.query.hasOwnProperty('token'))
      {
        let decipher = crypto.createDecipheriv('aes-128-cbc', process.env.ENCRYPTO_KEY, process.env.ENCRYPTO_IV);
        let decrypted = decipher.update(req.query.token, 'hex', 'binary');
        decrypted += decipher.final('binary');
        decrypted = JSON.parse(decrypted);
        //console.log("decrypted =>",decrypted);

        let error = false;
        let errorMsg = '';
        let confStatus = false;
        let response = {};

        /* Testing,
        CASE 1:
           decrypted = {
             participant_id : 1,
             conf_id : 133,
             participant_type : 'P'
          },
        CASE 2:
           decrypted = {
             customer_id : 6,
             conf_id : 0,
             participant_type : 'A'
          },
        CASE 3:
           decrypted = {
             customer_id : 6,
             conf_id : 133,
             participant_type : 'A'
          }
        */

        // Case 1: When perticipant is accessing
        if(decrypted.hasOwnProperty('participant_id') && decrypted.hasOwnProperty('conf_id') && decrypted.hasOwnProperty('participant_type') && decrypted.participant_type === 'P')
        {
              // Start verification token
              DBConnection.obj.AcConference.findOne({
                attributes: ["id", "confname", "conftype", "member", "live", "locked", "id_cc_card", "status", "starttime", "endtime", "created_date", "modification_date", "id_ac_pop_default"],
                where:{
                 id : decrypted.conf_id
               },
                include: [
                 {
      	           model: DBConnection.obj.AcPhonebookConf,
      	           attributes: ["id", "conf_type", "participanttype", "sms", "email",[DBConnection.obj.sequelize.fn('COUNT', 'id_ac_conf'), 'totalMember']],
                   //required: true,
      						 include:[{
      							 model: DBConnection.obj.AcPhonebook ,
                     attributes: ["id", "id_cc_card", "id_ac_phonebooktype", "title", "fname", "lname", "email", "phone", "designation", "department", "organisation", "id_am_crm_subuser"],
                     required: true,
           					 where:{
           						id: decrypted.participant_id
           					 }
      						 }]
                }
              ],
            group: ['id_ac_conf'],
             raw: true
            }).then(function(result){

              if(result)
              {
                // Record found

                  // check conference status
                  if(result.status === 0)
                  {
                     error = true;
                     errorMsg = 'Conference status is inactive.';
                  }else if(result.locked === 1)
                  {
                     error = true;
                     errorMsg = 'Conference status is locked.';
                  }else{
                    error = false;
                    confStatus = true;
                    errorMsg = '';
                  }
                    // Full name.
                    let full_name;
                    if(result['ac_phonebookconfs.ac_phonebooks.fname'] || result['ac_phonebookconfs.ac_phonebooks.lname'])
                    {
                      if(result['ac_phonebookconfs.ac_phonebooks.fname'] && result['ac_phonebookconfs.ac_phonebooks.lname'] =='')
                      {
                        full_name = result['ac_phonebookconfs.ac_phonebooks.title']+' '+result['ac_phonebookconfs.ac_phonebooks.fname'];
                      }else if(result['ac_phonebookconfs.ac_phonebooks.fname'] == '' && result['ac_phonebookconfs.ac_phonebooks.lname'])
                      {
                        full_name = result['ac_phonebookconfs.ac_phonebooks.title']+' '+result['ac_phonebookconfs.ac_phonebooks.lname'];
                      }else{
                        full_name = result['ac_phonebookconfs.ac_phonebooks.title']+' '+result['ac_phonebookconfs.ac_phonebooks.fname']+' '+result['ac_phonebookconfs.ac_phonebooks.lname'];
                      }
                    }else{
                      full_name = result['ac_phonebookconfs.ac_phonebooks.email'];
                    }

                    // List of details.
                   response ={
                     title : 'One 2 Many Calling',
                     error : error,
                     confStatus : confStatus,
                     errorMsg : errorMsg,
                     participant_type : decrypted.participant_type,
                     participant_conf_id : decrypted.conf_id,
                     conf_id : result.id,
                     confname : result.confname,
                     member : result.member,
                     totalMember : result['ac_phonebookconfs.totalMember'],
                     live : result.live,
                     starttime : dateformat(result.created_date, 'h:MM TT'),
                     participant_id : result['ac_phonebookconfs.ac_phonebooks.id'],
                     full_name : full_name,
                     email : result['ac_phonebookconfs.ac_phonebooks.email'],
                     designation  : result['ac_phonebookconfs.ac_phonebooks.designation'],
                     department  : result['ac_phonebookconfs.ac_phonebooks.department'],
                     organisation  : result['ac_phonebookconfs.ac_phonebooks.organisation']
                   };
                  // console.log("RRRR =>", result);

              }else{
                // Record not founds
                response ={
                  title : 'One 2 Many Calling',
                  error : true,
                  confStatus : confStatus,
                  errorMsg : 'Authentication failed!',
                  participant_type : decrypted.participant_type,
                  participant_conf_id : decrypted.conf_id,
                };
              }
             res.render('videoConferencing/participant', response);
            }).catch(function(err){

               response ={
                  title : 'One 2 Many Calling',
                  error : true,
                  confStatus : confStatus,
                  errorMsg : JSON.stringify(err),
                  participant_type : decrypted.participant_type,
                  participant_conf_id : decrypted.conf_id,
                };
            res.render('videoConferencing/participant', response);
      		 });
       } else if(decrypted.hasOwnProperty('customer_id') && decrypted.hasOwnProperty('conf_id') && !decrypted.conf_id && decrypted.hasOwnProperty('participant_type') && decrypted.participant_type === 'A')
         {
           // Case 2: When customer come from AMP portal
           DBConnection.obj.UaUserCustomer.findOne({
             attributes: ["uid", "email"],
             where : {
               uid : decrypted.customer_id
             },
             include: [
               {
                 model: DBConnection.obj.UaUserprofileCustomer ,
                 attributes: ["id", "title", "fname", "mname", "lname", "email"],
                 required: true
              },
              {
                model: DBConnection.obj.CcCard ,
                attributes: ["id"],
                required: true
             }
           ]
           }).then(function(result){
          //   console.log("dfsdf =>", result);
             response ={
                title : 'One 2 Many Calling',
                errorMsg : errorMsg,
                error : error,
                confStatus : confStatus,
                conf_id : decrypted.conf_id,
                participant_type : decrypted.participant_type,
                participant_conf_id : decrypted.conf_id,
                customer_id : decrypted.customer_id,
                amp_url : process.env.AMP_URL
              };

             if(result){
               response.cc_card_id = result.cc_cards[0].id;
             }else{
               response.errorMsg = "Record does not exists"
               response.error = true;
               response.cc_card_id = 0;
             }

            res.render('videoConferencing/customer', response);
           }).catch(function(err){
             response ={
                title : 'One 2 Many Calling',
                confStatus : confStatus,
                errorMsg : JSON.stringify(err),
                error : true,
                conf_id : decrypted.conf_id,
                participant_type : decrypted.participant_type,
                participant_conf_id : decrypted.conf_id,
                cc_card_id : 0,
                customer_id : decrypted.customer_id,
                amp_url : process.env.AMP_URL
              };
            res.render('videoConferencing/customer', response);
          });

       }else if(decrypted.hasOwnProperty('customer_id') && decrypted.hasOwnProperty('conf_id') && decrypted.conf_id >0 && decrypted.hasOwnProperty('participant_type') && decrypted.participant_type === 'A')
         {
           // Case 3: When customer go into a conference
           DBConnection.obj.UaUserCustomer.findOne({
             attributes: ["uid", "email"],
             where : {
               uid : decrypted.customer_id
             },
             include: [{
               model: DBConnection.obj.UaUserprofileCustomer ,
               attributes: ["id", "title", "fname", "mname", "lname", "email"],
               required: true
             },
             {
               model: DBConnection.obj.CcCard ,
               attributes: ["id"],
               required: true,
               include: [{
                   model: DBConnection.obj.AcConference ,
                   attributes: ["id", "confname", "conftype", "member", "live", "locked", "id_cc_card", "status", "starttime", "endtime", "created_date", "modification_date", "id_ac_pop_default"],
                   required: true,
                   where : {
                     id : decrypted.conf_id
                   },
                 include: [{
                     model: DBConnection.obj.AcPhonebookConf ,
                     attributes: [[DBConnection.obj.sequelize.fn('COUNT', 'id_ac_conf'), 'totalMember']],
                     required: true,
                   }]
                }]
             }],
             group: ['id_ac_conf'],
             raw: true
         }).then(function(result){
           //console.log("Data =>",JSON.stringify(result, null, "    "));
           response ={
               title : 'One 2 Many Calling',
               error : error,
               errorMsg : '',
               customer_id : decrypted.customer_id,
               participant_type : decrypted.participant_type,
               participant_conf_id : decrypted.conf_id,
               conf_id : decrypted.conf_id,
               amp_url : process.env.AMP_URL
             };
          if(result)
          {
            // check conference status
            if(result.status === 0)
            {
               errorMsg = 'Conference status is inactive.';
            }else if(result.locked === 1)
            {
               errorMsg = 'Conference status is locked.';
            }else{
              error = false;
              confStatus = true;
              errorMsg = '';
            }

            // Full name.
            let full_name;
            if(result['ua_userprofile_customer.fname'] || result['ua_userprofile_customer.lname'])
            {
              if(result['ua_userprofile_customer.fname'] && result['ua_userprofile_customer.lname'] =='')
              {
                full_name = result['ua_userprofile_customer.fname'];
              }else if(result['ua_userprofile_customer.fname'] == '' && result['ua_userprofile_customer.lname'])
              {
                full_name = result['ua_userprofile_customer.lname'];
              }else{
                full_name = result['ua_userprofile_customer.fname']+' '+result['ua_userprofile_customer.lname'];
              }
            }else{
              full_name = result['ua_userprofile_customer.email'];
            }

            response.confname = result['cc_cards.ac_confs.confname'];
            response.member = result['cc_cards.ac_confs.member'];
            response.live = result['cc_cards.ac_confs.live'];
            response.starttime = dateformat(result['cc_cards.ac_confs.created_date'], 'h:MM TT');
            response.totalMember =  result['cc_cards.ac_confs.ac_phonebookconfs.totalMember'];
            response.participant_id = result.uid;
            response.full_name = full_name;
            response.email = result.email;
            response.designation  = '';
            response.department  = '';
            response.organisation  = '';
            response.confStatus = response;
          }
            res.render('videoConferencing/customer', response);

         }).catch(function(err){
           response ={
               title : 'One 2 Many Calling',
               error : true,
               errorMsg : JSON.stringify(err),
               confStatus:confStatus,
               customer_id : decrypted.customer_id,
               participant_type : decrypted.participant_type,
               participant_conf_id : decrypted.conf_id,
               conf_id : decrypted.conf_id,
               amp_url : process.env.AMP_URL
             };
              res.render('videoConferencing/customer', response);
         });
       }else{
          response ={
             title : 'One 2 Many Calling',
             error : true,
             errorMsg : 'There are some missing please provide valid token',
             confStatus:confStatus,
             participant_type : "P",
             participant_conf_id : 0,
           };
         res.render('videoConferencing/error', response);
       }
       // @end verification token
    }else{
         let response ={
             title : 'One 2 Many Calling',
             error : true,
             errorMsg : 'There are some missing please provide valid token',
             confStatus:false,
             participant_type : "P",
             participant_conf_id : 0,
           };
       res.render('videoConferencing/error', response);
      }
    },
};
