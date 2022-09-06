const controller = {};

controller.privacyPolicy = async function (req ,res){
    try {
        
        res.render("PrivacyPolicy");
      } catch (ex) {
        return res.status(500).json({
          success: false,
          message: ex.message,
        });
      }

}



module.exports = controller;