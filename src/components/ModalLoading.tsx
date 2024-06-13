import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  Center,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Spinner,
} from "@chakra-ui/react";
import React, { FC } from "react";

const OverlayOne = () => (
  <ModalOverlay
    bg="blackAlpha.300"
    backdropFilter="blur(10px) hue-rotate(90deg)"
  />
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  isDone: boolean;
};

const ModalLoading: FC<Props> = ({ isOpen, onClose, isDone }) => {
  React.useEffect(() => {
    if (isDone) {
      setTimeout(() => {
        onClose();
      }, 15_000);
    }
  }, [isDone]);

  return (
    <>
      <Modal isCentered size="xl" isOpen={isOpen} onClose={onClose}>
        <OverlayOne />
        <ModalContent>
          <ModalHeader>
            {isDone ? "Payment Successful" : "Payment Processing..."}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Center h="500px">
              {!isDone ? (
                <Spinner
                  thickness="10px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                />
              ) : (
                <Alert
                  status="success"
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  height="200px"
                >
                  <AlertIcon boxSize="40px" mr={0} />
                  <AlertTitle mt={4} mb={1} fontSize="lg">
                    Payment successful!
                  </AlertTitle>
                  <AlertDescription maxWidth="sm">
                    Thanks for submitting your application. Our team will get
                    back to you soon.
                  </AlertDescription>
                </Alert>
              )}
            </Center>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModalLoading;
