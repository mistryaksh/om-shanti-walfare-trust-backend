import { Request, Response } from "express";
import { AdminRoute } from "../../../middleware";
import { IController, IControllerRoutes, IDonationProps } from "../../../interface";
import { DONATIONS_PREFIX, Ok, UnAuthorized } from "../../../utils";
import { RazorPayService } from "services/razorpay.services";
import { Donation } from "model";
import jwt from "jsonwebtoken";
import config from "config";

export class DonationController implements IController {
     public routes: IControllerRoutes[] = [];
     constructor() {
          this.routes.push({
               handler: this.StartDonation,
               path: `/${DONATIONS_PREFIX}`,
               method: "POST",
          });
          this.routes.push({
               handler: this.GetAllDonations,
               method: "GET",
               path: `/${DONATIONS_PREFIX}/all`,
               middleware: [AdminRoute],
          });
     }

     public async StartDonation(req: Request, res: Response) {
          try {
               const { amount, custName, email, mobile }: IDonationProps = req.body;
               if (!amount || !custName || !email || !mobile) {
                    return UnAuthorized(res, "missing fields");
               }
               const refId = ` ${custName.replace(" ", "")}__#${Date.now()}`;
               const paymentToken = jwt.sign(
                    {
                         refId: refId,
                         custName: custName,
                    },
                    process.env.JWT_SECRET || config.get("JWT_SECRET")
               );
               const data = await RazorPayService.ReceivePayment({
                    amount,
                    custName,
                    email,
                    mobile,
                    paymentToken,
                    referenceId: refId,
                    status: "INITIATED",
               });
               await new Donation({
                    amount,
                    custName,
                    email,
                    mobile,
                    paymentToken,
                    referenceId: refId,
                    status: "INITIATED",
               }).save();
               return Ok(res, data);
          } catch (err) {
               return UnAuthorized(res, err as string);
          }
     }

     public async GetAllDonations(req: Request, res: Response) {
          try {
               const donations = await Donation.find().sort({ createdAt: -1 });
               return Ok(res, donations);
          } catch (err) {
               return UnAuthorized(res, err);
          }
     }
}
