import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface MagicLinkEmailProps {
  magicLink: string;
}

export default function MagicLinkEmail({ magicLink }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to Genwel</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Genwel</Heading>
          <Section style={section}>
            <Text style={text}>
              Click the button below to sign in to your Genwel account.
            </Text>
            <Link href={magicLink} style={button}>
              Sign in to Genwel
            </Link>
            <Text style={footnote}>
              If the button doesn&apos;t work, copy and paste this link into your
              browser:
            </Text>
            <Text style={linkText}>{magicLink}</Text>
            <Text style={footnote}>
              This link expires in 15 minutes and can only be used once.
            </Text>
          </Section>
          <Text style={footer}>
            If you didn&apos;t request this email, you can safely ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
  borderRadius: "8px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#1a1a1a",
  textAlign: "center" as const,
  margin: "0 0 30px",
};

const section = {
  textAlign: "center" as const,
};

const text = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#525f7f",
  margin: "0 0 20px",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "8px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "50px",
  textAlign: "center" as const,
  textDecoration: "none",
  width: "200px",
  margin: "0 0 20px",
};

const footnote = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#8898aa",
  margin: "0 0 10px",
};

const linkText = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#525f7f",
  wordBreak: "break-all" as const,
  margin: "0 0 20px",
  fontFamily: "monospace",
};

const footer = {
  fontSize: "12px",
  lineHeight: "20px",
  color: "#8898aa",
  textAlign: "center" as const,
  margin: "30px 0 0",
};
