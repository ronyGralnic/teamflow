"use client"

import React from 'react'
//import { MessageList } from './_components/MessageList'
import { MessageInputForm } from './_components/message/MessageInputForm'
import { useParams } from 'next/navigation'
import { ChannelHeader } from './_components/ChannelHeader'
import { MessageList } from './_components/MessageList'

const channelPageMain = () => {
  const  {channelid} = useParams<{channelid : string}>()
  return (
    <div className="flex h-screen w-full">
        {/* Main Channel Area */}
        <div className="flex flex-col flex-1 min-w-0">

            {/* Fixed Header */}
            <ChannelHeader/>

            {/*Scrollable Messages Area */}
            <div className="flex-1 overflow-hidden mb-4">
              <MessageList/>
            </div>

            {/* Fixed Input */}
            <div className='border-t bg-background p-4'>
              <MessageInputForm channelId={channelid}/>

            </div>


        </div>

       
    </div>
  )
}

export default channelPageMain