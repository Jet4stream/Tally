

import { PDFDocument, rgb } from "pdf-lib";

export async function fillReimbursementPDF(data: {
  payTo: string;
  studentId: string;
  email: string;
  phone: string;
  permAddress: string;
  permCityStateZip: string;
  localAddress: string;
  localCityStateZip: string;
  amount: string;
  expenses: { description: string; amount: string }[];
  date: string;
  club: string;
  signature: string;
  eventBudgetLine: string;
}) {
  const templateBytes = await fetch("/templates/reimbursement-form.pdf").then(
    (res) => res.arrayBuffer()
  );
  const pdf = await PDFDocument.load(templateBytes);
  const page = pdf.getPages()[0];

  const size = 11;
  const color = rgb(0, 0, 0);



  // Tufts Student ID#
  page.drawText(data.studentId, { x: 455, y: 450, size, color });

  // Permanent Address
  page.drawText(data.permAddress, { x: 170, y: 415, size, color });
  page.drawText(data.permCityStateZip, { x: 415, y: 415, size, color });

  // Local Address
  page.drawText(data.localAddress, { x: 150, y: 395, size, color });
  page.drawText(data.localCityStateZip, { x: 405, y: 395, size, color });

// Primary Phone: (___) ___-____
const digits = data.phone.replace(/\D/g, ""); // strip non-digits
const area = digits.slice(0, 3);
const mid = digits.slice(3, 6);
const last = digits.slice(6, 10);
page.drawText(area, { x: 155, y: 373, size, color });
page.drawText(mid, { x: 195, y: 373, size, color });
page.drawText(last, { x: 232, y: 373, size, color });

  // Primary E-Mail
  page.drawText(data.email, { x: 365, y: 375, size, color });

  // Reimbursement Payable To
  page.drawText(data.payTo, { x: 210, y: 450, size, color });

  // Organization Name
  page.drawText(data.club, { x: 190, y: 355, size, color });

  // Expense lines a–e (descriptions + amounts)
  const expenseYStart = 305;
  const expenseYGap = 20;
  for (let i = 0; i < Math.min(data.expenses.length, 5); i++) {
    const y = expenseYStart - i * expenseYGap;
    if (data.expenses[i].description) {
      page.drawText(data.expenses[i].description, { x: 120, y, size, color });
    }
    if (data.expenses[i].amount) {
      page.drawText(`$${parseFloat(data.expenses[i].amount).toFixed(2)}`, { x: 430, y, size, color });
    }
  }

  // TOTAL
  page.drawText(data.amount, { x: 430, y: 205, size, color });

  // Event Name and/Budget Line Item Purchased
  page.drawText(data.eventBudgetLine, { x: 80, y: 165, size, color });

  // Organization Signatory Name
  page.drawText(data.signature, { x: 285, y: 135, size, color });

  // Organization Signatory Signature
  page.drawText(data.signature, { x: 300, y: 110, size, color });

  // Date
  page.drawText(data.date, { x: 100, y: 85, size, color });

  return await pdf.save();
}

