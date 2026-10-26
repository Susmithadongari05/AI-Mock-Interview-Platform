import { PDFParse } from 'pdf-parse';
import Resume from '../models/Resume.model.js';


// ========================================
// PARSE RESUME PDF
// ========================================

export const parseResumePDF = async (pdfBuffer) => {
  let parser;

  try {
    parser = new PDFParse({
      data: pdfBuffer,
    });

    const result = await parser.getText();

    const extractedText = result.text?.trim();

    if (!extractedText) {
      throw new Error(
        'No text could be extracted from the PDF'
      );
    }

    return extractedText;

  } catch (error) {

    console.error(
      'PDF Parse Error:',
      error
    );

    throw new Error(
      'Failed to parse PDF. Please upload a valid PDF file.'
    );

  } finally {

    if (parser) {
      await parser.destroy();
    }

  }
};


// ========================================
// SAVE RESUME
// ========================================

export const saveResume = async (
  userId,
  fileName,
  extractedText
) => {

  try {

    const resume =
      await Resume.findOneAndUpdate(
        { userId },

        {
          userId,
          fileName,
          extractedText,
        },

        {
          returnDocument: 'after',
          upsert: true,
        }
      );

    return resume;

  } catch (error) {

    console.error(
      'Save Resume Error:',
      error.message
    );

    throw error;
  }
};


// ========================================
// GET USER RESUME
// ========================================

export const getUserResume = async (
  userId
) => {

  const resume =
    await Resume.findOne({
      userId,
    }).select('-__v');

  return resume;
};