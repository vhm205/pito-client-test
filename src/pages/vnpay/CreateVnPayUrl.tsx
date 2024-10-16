import React, { FC, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import {
  useToast,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  RadioGroup,
  Radio,
  Stack,
  Divider,
  Alert,
} from "@chakra-ui/react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
  createClient,
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from "@supabase/supabase-js";

import { formatVND, copyToClipboard } from "../../helpers";

const { VITE_NON_KEY_PRODUCTION, VITE_SUPABASE_URL_PRODUCTION } = import.meta
  .env;

const supabase = createClient(
  VITE_SUPABASE_URL_PRODUCTION,
  VITE_NON_KEY_PRODUCTION,
);

// Define validation schema using Yup
const validationSchema = Yup.object({
  amount: Yup.number()
    .required("Amount is required")
    .positive("Amount must be positive")
    .min(1, "Amount must be at least 1"),
  bankCode: Yup.string().required("Please select a payment method"),
});

const CreateVnPayUrl: FC = () => {
  const [messageStatus, setMessageStatus] = useState("");
  const [formattedAmount, setFormattedAmount] = useState("");
  const [objResponse, setObjResponse] = useState({});
  const toast = useToast();

  const notify = (props) => {
    toast({
      ...props,
      isClosable: true,
      position: "top-right",
    });
  };

  useEffect(() => {
    const login = async () => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: "vuhuynhminh9221@gmail.com",
        password: "Admin@102",
      });
      console.log({ data, error });

      if (error) {
        notify({ title: error.message, status: "success" });
      }
    };

    login();
  }, []);

  const initialValues = {
    orderId: uuidv4(),
    orderCode: dayjs().format("YYYYMMDDHHmm"),
    amount: 0,
    bankCode: "VISA",
  };

  // Initialize Formik
  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: async (values, actions) => {
      console.log("Form values:", values);

      try {
        notify({ title: "Fetching...", status: "info" });

        const { data, error } = await supabase.functions.invoke(
          "payment-vnpay",
          {
            headers: {
              "x-invoke-func": "create-url-payment",
            },
            body: {
              payload: {
                order_id: values.orderId,
                order_code: values.orderCode,
                amount: +values.amount,
                bank_code: values.bankCode,
              },
            },
          },
        );

        if (data?.data?.redirectUrl) {
          copyToClipboard(data.data.redirectUrl);
          notify({
            title: "Link has been copied to clipboard",
            status: "success",
          });
          setMessageStatus("Link has been copied to clipboard");
        } else {
          let errorMessage = error?.message;
          let errorJson = null;

          if (error instanceof FunctionsHttpError) {
            const errorMsg = await error.context.json();
            errorJson = errorMsg;
            errorMessage = errorMsg.message;
            console.log("Function returned an error", errorMsg);
          } else if (error instanceof FunctionsRelayError) {
            console.log("Relay error:", error.message);
          } else if (error instanceof FunctionsFetchError) {
            console.log("Fetch error:", error.message);
          }

          setObjResponse({ data, error, errorMessage, errorJson });
        }
      } catch (error) {
        console.error({ error });
        notify({ title: error.message, status: "error" });
      } finally {
        actions.setSubmitting(false);
      }

      // Handle form submission logic here
    },
  });

  const handleAmountChange = (e) => {
    const { value } = e.target;
    const numericValue = value.replace(/\D/g, ""); // Remove non-digit characters
    formik.setFieldValue("amount", numericValue);

    // Update the formatted value to display in the input
    setFormattedAmount(formatVND(numericValue));
  };

  return (
    <>
      <form
        onSubmit={formik.handleSubmit}
        className="p-4 bg-white rounded-lg shadow-md max-w-md mx-auto"
      >
        <FormControl mb={4}>
          <FormLabel> Order Code </FormLabel>
          <Input
            disabled
            value={formik.values.orderCode}
            name="orderCode"
            placeholder="orderCode"
          />
        </FormControl>

        <FormControl
          isInvalid={formik.touched.amount && !!formik.errors.amount}
          mb={4}
        >
          <FormLabel htmlFor="amount">Enter Amount</FormLabel>
          <Input
            id="amount"
            name="amount"
            placeholder="Enter amount"
            value={formattedAmount}
            onChange={handleAmountChange}
            onBlur={formik.handleBlur}
            className="focus:ring-2 focus:ring-blue-500"
          />
          <FormErrorMessage>{formik.errors.amount}</FormErrorMessage>
        </FormControl>

        <FormControl
          isInvalid={formik.touched.bankCode && !!formik.errors.bankCode}
          mb={4}
        >
          <FormLabel>Select Payment Method</FormLabel>
          <RadioGroup
            name="bankCode"
            onChange={(value) => formik.setFieldValue("bankCode", value)}
            value={formik.values.bankCode}
          >
            <Stack direction="row">
              <Radio value="VISA">VISA</Radio>
              <Radio value="MASTERCARD">MASTERCARD</Radio>
              <Radio value="ATM">ATM</Radio>
              <Radio value="VNBANK">VNBANK</Radio>
              <Radio value="JCB">JCB</Radio>
              <Radio value="UPI">UPI</Radio>
              <Radio value="AMEX">AMEX</Radio>
            </Stack>
          </RadioGroup>
          <FormErrorMessage>{formik.errors.bankCode}</FormErrorMessage>
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          className="mt-4 w-full"
          isLoading={formik.isSubmitting}
        >
          Submit
        </Button>
      </form>

      {messageStatus ? (
        <Alert mt={3} status="success">
          {messageStatus}
        </Alert>
      ) : null}

      {Object.keys(objResponse).length ? (
        <>
          <Divider mt={3} />
          <pre>{JSON.stringify(objResponse, null, 2)}</pre>
        </>
      ) : null}

      {/* <Formik */}
      {/*   initialValues={initialValues} */}
      {/*   onSubmit={(values, actions) => { */}
      {/*     setTimeout(() => { */}
      {/*       alert(JSON.stringify(values, null, 2)); */}
      {/*       actions.setSubmitting(false); */}
      {/*     }, 1000); */}
      {/*   }} */}
      {/* > */}
      {/*   {(props) => ( */}
      {/*     <form onSubmit={props.handleSubmit}> */}
      {/*       <FormControl> */}
      {/*         <FormLabel> Order Code </FormLabel> */}
      {/*         <Input */}
      {/*           disabled */}
      {/*           value={props.values.orderCode} */}
      {/*           name="orderCode" */}
      {/*           placeholder="orderCode" */}
      {/*         /> */}
      {/*       </FormControl> */}
      {/**/}
      {/*       <Divider mt={3} mb={3} /> */}
      {/**/}
      {/*       <FormControl> */}
      {/*         <FormLabel> Amount </FormLabel> */}
      {/*         <NumberInput */}
      {/*           min={10_000} */}
      {/*           name="amount" */}
      {/*           onBlur={props.handleBlur} */}
      {/*           onChange={props.handleChange} */}
      {/*         > */}
      {/*           <NumberInputField /> */}
      {/*           <NumberInputStepper> */}
      {/*             <NumberIncrementStepper /> */}
      {/*             <NumberDecrementStepper /> */}
      {/*           </NumberInputStepper> */}
      {/*         </NumberInput> */}
      {/*       </FormControl> */}
      {/**/}
      {/*       <Divider mt={3} mb={3} /> */}
      {/**/}
      {/*       <FormControl as="fieldset"> */}
      {/*         <FormLabel as="legend">Select payment method</FormLabel> */}
      {/*         <RadioGroup defaultValue="VISA"> */}
      {/*           <HStack spacing="24px"> */}
      {/*             <Radio value="VISA">VISA</Radio> */}
      {/*             <Radio value="MASTERCARD">MASTERCARD</Radio> */}
      {/*             <Radio value="ATM">ATM</Radio> */}
      {/*             <Radio value="VNBANK">VNBANK</Radio> */}
      {/*             <Radio value="JCB">JCB</Radio> */}
      {/*             <Radio value="UPI">UPI</Radio> */}
      {/*             <Radio value="AMEX">AMEX</Radio> */}
      {/*           </HStack> */}
      {/*         </RadioGroup> */}
      {/*         <FormHelperText> */}
      {/*           *Currently vnpay payment does not support QR code. */}
      {/*         </FormHelperText> */}
      {/*       </FormControl> */}
      {/**/}
      {/*       <Button */}
      {/*         mt={4} */}
      {/*         colorScheme="teal" */}
      {/*         isLoading={props.isSubmitting} */}
      {/*         type="submit" */}
      {/*       > */}
      {/*         Submit */}
      {/*       </Button> */}
      {/*     </form> */}
      {/*   )} */}
      {/* </Formik> */}
      {/* <FormControl isInvalid={isError} isRequired> */}
      {/*   <FormLabel>Email</FormLabel> */}
      {/*   <Input type="email" value={input} onChange={handleInputChange} /> */}
      {/*   {!isError ? ( */}
      {/*     <FormHelperText> */}
      {/*       Enter the email you'd like to receive the newsletter on. */}
      {/*     </FormHelperText> */}
      {/*   ) : ( */}
      {/*     <FormErrorMessage>Email is required.</FormErrorMessage> */}
      {/*   )} */}
      {/* </FormControl> */}
    </>
  );
};

export default CreateVnPayUrl;
