import { Fragment } from "react";

import { ScrollableContainer } from "@/app/markets/components/scrollable-container";
import { Card } from "@/components/ui/Card/card";
import { Text } from "@/components/ui/Text/text";
import { TERMS_AND_CONDITIONS } from "@/lib/constants";
import Footer from "../components/footer";

export default function TermsAndConditionsPage() {
  return (
    <>
      <main className="grow bg-[#141414] min-h-[700px] py-8 text-white px-4 sm:px-0">
        <div className="max-w-[800px] mx-auto sm:px-4">
          <div className="grid grid-cols-1 gap-4">
            <h1 className="text-2xl font-medium mb-4">Terms & Conditions</h1>
            <Card>
              <ScrollableContainer className="h-[540px]">
                {TERMS_AND_CONDITIONS.map((item, index) => (
                  <Fragment key={index}>
                    <h2 className="font-semibold">{item.title}</h2>
                    <Text className="whitespace-pre-line text-xs font-light mb-6">{item.description}</Text>
                  </Fragment>
                ))}
              </ScrollableContainer>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
