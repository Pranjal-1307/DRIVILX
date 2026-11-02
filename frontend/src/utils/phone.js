export const PHONE_COUNTRY_CODES = [
    { label: "India (+91)", value: "+91" },
    { label: "United States / Canada (+1)", value: "+1" },
    { label: "United Kingdom (+44)", value: "+44" },
    { label: "Australia (+61)", value: "+61" },
    { label: "United Arab Emirates (+971)", value: "+971" },
    { label: "Singapore (+65)", value: "+65" },
    { label: "Nepal (+977)", value: "+977" },
    { label: "Bangladesh (+880)", value: "+880" }
];

export function normalizePhone(value) {
    const phone = String(value || "").replace(/[\s().-]/g, "");
    if (!/^\+[1-9][0-9]{7,14}$/.test(phone)) {
        throw new Error("Enter a valid international mobile number including its country code.");
    }
    if (phone.startsWith("+91") && !/^\+91[6-9][0-9]{9}$/.test(phone)) {
        throw new Error("Enter a valid 10-digit Indian mobile number.");
    }
    return phone;
}

export function composePhone(countryCode, nationalNumber) {
    const national = String(nationalNumber || "").replace(/\D/g, "");
    return normalizePhone(`${countryCode}${national}`);
}
