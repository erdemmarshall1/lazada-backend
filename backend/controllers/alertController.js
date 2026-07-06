const { success } = require('../utils/response');

exports.getAlertList = async (req, res) => {
  const data = [
    { id: 1, content: 'Start your first business now in your THE OUTNET CN store!' },
    { id: 2, content: 'One-stop management Store, inventory, orders, promotions, creator partnerships and customer service are all completed in the THE OUTNET CN store.' },
    { id: 3, content: 'THE OUTNET CN can strengthen its global market position through technological empowerment and ecosystem expansion, while also driving shopping trends.' },
  ];
  res.json(success(data));
};
