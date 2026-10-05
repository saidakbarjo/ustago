"use client";
import { Suspense } from "react";
import { Chat } from "@/components/chat";
export default function MessagesPage() { return <Suspense><Chat audience="user" /></Suspense>; }
