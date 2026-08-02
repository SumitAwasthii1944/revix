"use client"
import { useEffect,useState } from "react"
import {prisma} from "@/lib/prisma"

interface Data {
          prNumber:string
          repo:string
}

export default function loadPrReviews(reviewData:Data){
          const [reviews,setReviews] = useState([])
          
          
          
}