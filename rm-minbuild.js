const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.development' });
mongoose.connect(process.env.MONGO_URL).then(async () => {
  await mongoose.connection.collection('appversions').updateMany({}, { $unset: { minBuildNumber: "" } });
  console.log('done');
  process.exit(0);
});
