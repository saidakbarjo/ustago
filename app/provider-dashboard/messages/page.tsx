"use client";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
export default function ProviderMessages() { return <Suspense><Chat audience="provider" /></Suspense>; }
