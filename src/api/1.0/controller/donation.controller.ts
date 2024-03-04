import { Request, Response } from "express";
import {} from "../../../middleware";
import {
     DonationInitialProps,
     IController,
     IControllerRoutes,
     IDonationProps,
     PhonePeRedirectMode,
     PhonePeRequestedBody,
} from "../../../interface";
import axios from "axios";
import { Ok, UnAuthorized } from "../../../utils";
import { newPayment } from "services/phone-pe.service";
import crypto, { randomUUID } from "crypto";
import { Donation } from "model";

export class DonationController implements IController {
     public routes: IControllerRoutes[] = [];
     constructor() {
          this.routes.push({
               handler: this.PayApi,
               path: "/donation/pay",
               method: "POST",
          });
          this.routes.push({
               handler: this.PayApi,
               path: "/donation/check-status/:transactionId",
               method: "POST",
          });
     }

     public async PayApi(req: Request, res: Response) {
          try {
               const merchantTransactionId = "M" + Date.now();
               const { amount, email, mobile, userName, userId }: DonationInitialProps = req.body;
               if (!amount || !email || !mobile || !userName) {
                    return UnAuthorized(res, "missing credentials");
               }
               const data: PhonePeRequestedBody = {
                    merchantId: process.env.PHONE_PE_MERCHAT_ID,
                    merchantTransactionId: merchantTransactionId,
                    merchantUserId: "MUID" + userId,
                    name: userName,
                    amount: amount * 100,
                    // !Change call here
                    redirectUrl: `http://localhost:3001/api/v1/status/${merchantTransactionId}`,
                    redirectMode: PhonePeRedirectMode.POST,
                    mobileNumber: mobile,
                    paymentInstrument: {
                         type: "PAY_PAGE",
                    },
               };
               const payload = JSON.stringify(data);
               const payloadMain = Buffer.from(payload).toString("base64");
               const keyIndex = 1;
               const string = payloadMain + "/pg/v1/pay" + process.env.PHONE_PE_API_KEY;
               const sha256 = crypto.createHash("sha256").update(string).digest("hex");
               const checksum = sha256 + "###" + keyIndex;
               const prod_URL = "https://api.phonepe.com/apis/hermes/pg/v1/pay";

               const newDonation = await new Donation({
                    userId: userId,
                    amount: amount,
                    custName: userName,
                    email: email,
                    mobile: mobile,
                    referenceId: randomUUID(),
                    paymentToken: checksum,
                    status: "INITIATED",
               }).save();
               const axiosResponse = await axios.post(
                    prod_URL,
                    {
                         request: payloadMain,
                    },
                    {
                         headers: {
                              Accept: "application/json",
                              "Content-Type": "application/json",
                              "X-VERIFY": checksum,
                         },
                    }
               );
               return Ok(res, await axiosResponse.data.data.instrumentResponse.redirectInfo);
          } catch (err) {
               console.log(err.response.data);
               return UnAuthorized(res, err as string);
          }
     }
}
