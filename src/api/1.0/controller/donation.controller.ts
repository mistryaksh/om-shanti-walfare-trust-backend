import { Request, Response } from "express";
import { AdminRoute } from "../../../middleware";
import { IController, IControllerRoutes, IDonationProps, SendMailProps } from "../../../interface";
import { DONATIONS_PREFIX, MailService, Ok, UnAuthorized } from "../../../utils";
import { RazorPayService } from "services/razorpay.services";
import { Donation } from "model";
import jwt from "jsonwebtoken";
import config from "config";
import { Attachment } from "nodemailer/lib/mailer";

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
          this.routes.push({ handler: this.GetDonationById, method: "GET", path: `/${DONATIONS_PREFIX}/:donationId` });
          this.routes.push({ handler: this.SendMailToDonator, method: "POST", path: `/${DONATIONS_PREFIX}/send-mail` });
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

     public async GetDonationById(req: Request, res: Response) {
          try {
               const { donationId } = req.params;
               const donation = await Donation.findById({ _id: donationId });
               return Ok(res, donation);
          } catch (err) {
               return UnAuthorized(res, err);
          }
     }

     public async SendMailToDonator(req: Request, res: Response) {
          try {
               const { donatorMailId, fileLink, subject }: SendMailProps = req.body;
               console.log(req.body);
               if (!fileLink || !donatorMailId || !subject) {
                    return UnAuthorized(res, "missing fields");
               }
               const sentMailResponse = MailService.sendMail(
                    {
                         from: "mistryaksh1998@gmail.com",
                         to: "bmistry092@gmail.com",
                         subject: `COLLECT YOUR 80G CERTIFICATE`,
                         html: `
                         ${subject}
                         Hi there! 😍
                         <h1>Thank you for donation on om shanti welfare trust</h1>
                         <p>
                              Lorem ipsum dolor sit amet consectetur adipisicing elit. Eaque culpa sint sed facilis suscipit, aut repellat consequuntur aperiam. Obcaecati, voluptatem.
                         </p>
                         <p>Here is your official 80G certification from our NGO</p>
                         80G Link - ${fileLink}
                         `,
                    },
                    (error, response) => {
                         if (error) {
                              console.log("error", error);
                              return UnAuthorized(res, error.message);
                         } else {
                              return Ok(res, "MAIL_SENT");
                         }
                    }
               );
          } catch (err) {
               return UnAuthorized(res, err);
          }
     }
}
