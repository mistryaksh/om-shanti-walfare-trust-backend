export interface IDonationConfigProps {
     key_id: string;
     key_secret: string;
     minimumDonation: string;
     active?: boolean;
}

export interface IDonationProps {
     amount: number;
     custName: string;
     email: string;
     mobile: string;
     referenceId: string;
     paymentToken: string;
     status: DonationStatus;
}

export type DonationStatus = "SUCCESS" | "REFUNDED" | "FAILED" | "CANCELLED" | "NOT_PERFORMED" | "INITIATED";

export interface SendMailProps {
     donatorMailId: string;
     subject: string;
     fileLink: string;
}
