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
import React, { FC, useEffect } from "react";

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
  status: string;
};

const ModalLoading: FC<Props> = ({ isOpen, onClose, status, isDone }) => {
  const [title, setTitle] = React.useState("");

  useEffect(() => {
    if (isDone) {
      setTimeout(() => {
        onClose();
      }, 15_000);
    }
  }, [isDone]);

  useEffect(() => {
    if (status === "completed") {
      setTitle("Payment Successful :)");
    } else if (status === "failed") {
      setTitle("Payment Failed! :(");
    } else {
      setTitle("Processing...");
    }
  }, [status]);

  return (
    <>
      <Modal isCentered size="xl" isOpen={isOpen} onClose={onClose}>
        <OverlayOne />
        <ModalContent>
          <ModalHeader>
            {title} - {isDone}
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
                  status={status === "completed" ? "success" : "error"}
                  variant="subtle"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  textAlign="center"
                  height="200px"
                >
                  <AlertIcon boxSize="40px" mr={0} />
                  <AlertTitle mt={4} mb={1} fontSize="lg">
                    {title}
                  </AlertTitle>
                  <AlertDescription maxWidth="sm">
                    Thanks for submitting your application.
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
