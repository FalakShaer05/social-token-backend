const SupportModel = require('./models/SupportModel');
const settings = require('../../server-settings');
const mailer = require('../helpers/mailer');
const { serveView } = require('../helpers/viewHelper');

const controller = {};

/**
 * Create a new support ticket
 */
controller.createSupportTicket = async function (req, res) {
  try {
    const { name, email, subject, message, priority, category } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required fields'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    // Create support ticket data
    const supportData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      priority: priority || 'medium',
      category: category || 'general',
      user_agent: req.get('User-Agent') || '',
      ip_address: req.ip || req.connection.remoteAddress || ''
    };

    // Create and save the support ticket
    const supportTicket = new SupportModel(supportData);
    await supportTicket.save();

    // Send email notification to admin (optional)
    try {
      const emailSubject = `New Support Ticket: ${supportData.subject}`;
      const emailHtml = `
        <h2>New Support Ticket Received</h2>
        <p><strong>Name:</strong> ${supportData.name}</p>
        <p><strong>Email:</strong> ${supportData.email}</p>
        <p><strong>Subject:</strong> ${supportData.subject}</p>
        <p><strong>Category:</strong> ${supportData.category}</p>
        <p><strong>Priority:</strong> ${supportData.priority}</p>
        <p><strong>Message:</strong></p>
        <p>${supportData.message.replace(/\n/g, '<br>')}</p>
        <p><strong>Ticket ID:</strong> ${supportTicket._id}</p>
        <p><strong>Submitted:</strong> ${supportTicket.created}</p>
      `;
      
      await mailer.sendMail(settings.emailPreferences.emailAddress, emailSubject, emailHtml);
      console.log('✅ Support email notification sent successfully');
    } catch (emailError) {
      console.error('❌ Failed to send support email notification:', emailError);
      // Don't fail the request if email fails
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: {
        ticket_id: supportTicket._id,
        status: supportTicket.status,
        created: supportTicket.created
      }
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get all support tickets (admin only)
 */
controller.getAllSupportTickets = async function (req, res) {
  try {
    const { page = 1, limit = 10, status, category, priority } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;

    const tickets = await SupportModel.find(filter)
      .sort({ created: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    const total = await SupportModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: 'Support tickets retrieved successfully',
      data: {
        tickets,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_tickets: total,
          limit: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error retrieving support tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support tickets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get a specific support ticket by ID
 */
controller.getSupportTicket = async function (req, res) {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Support ticket ID is required'
      });
    }

    const ticket = await SupportModel.findById(id);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support ticket retrieved successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error retrieving support ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update support ticket status (admin only)
 */
controller.updateSupportTicket = async function (req, res) {
  try {
    const { id } = req.params;
    const { status, priority, category } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Support ticket ID is required'
      });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (category) updateData.category = category;

    const ticket = await SupportModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Support ticket updated successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update support ticket',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Serve the support form HTML page
 */
controller.getSupportForm = async function (req, res) {
  // Use the view helper to serve the support form
  serveView(res, 'support-form', 'pages');
};

module.exports = controller;
