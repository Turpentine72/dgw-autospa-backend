const Booking = require('../models/Booking');
const Review = require('../models/Review');

exports.getStats = async (req, res, next) => {
  try {
    // Vehicles Detailed = number of completed bookings
    const vehiclesDetailed = await Booking.countDocuments({ status: 'completed' });

    // Approved reviews only
    const totalApprovedReviews = await Review.countDocuments({ status: 'approved' });
    let satisfactionRate = 0;
    let averageRating = 0;

    if (totalApprovedReviews > 0) {
      const positiveApprovedReviews = await Review.countDocuments({ 
        status: 'approved',
        rating: { $gte: 4 } 
      });
      satisfactionRate = Math.round((positiveApprovedReviews / totalApprovedReviews) * 100);

      const avgRatingResult = await Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avg: { $avg: '$rating' } } }
      ]);
      averageRating = parseFloat(avgRatingResult[0].avg.toFixed(1));
    }

    res.json({
      success: true,
      data: {
        vehiclesDetailed,
        satisfactionRate,
        averageRating
      }
    });
  } catch (err) {
    next(err);
  }
};