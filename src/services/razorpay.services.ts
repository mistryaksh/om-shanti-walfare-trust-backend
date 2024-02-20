import { v4 } from "uuid";
import Razorpay from "razorpay";
import { IDonationProps } from "interface";

const instance = new Razorpay({
     key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_3wRz40Z4dhjapc",
     key_secret: process.env.RAZORPAY_KET_SECRET || "yyRoEwfrk9z74Je5edd4J2hT",
});

class RazorPayServices {
     public async ReceivePayment({ amount, custName, email, mobile, referenceId, paymentToken }: IDonationProps) {
          const response = await instance.paymentLink.create({
               amount: amount,
               currency: "INR",
               reference_id: referenceId,
               notes: {
                    recept: `${custName}#${v4()}`,
               },
               accept_partial: false,
               customer: {
                    name: custName,
                    email: email,
                    contact: `+91${mobile}`,
               },
               notify: {
                    // sms: true,
                    email: true,
               },
               callback_url: `https://om-shanti.netlify.app/refer_id`,
               callback_method: "get",
               // upi_link: true,
          });

          return {
               paymentURL: response.short_url,
               paymentFor: response.amount,
               paymentToken,
               referenceId,
               // upi: response.upi_link, // enable in production
          };
     }
}

export const RazorPayService = new RazorPayServices();
