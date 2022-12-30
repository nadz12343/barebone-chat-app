

export default function Chatbubble({sender, message}){

    const className_ = `max-w-[50%] h-fit  ${sender ? 'bg-purple-600' : 'bg-orange-300'} m-4 rounded-md p-4 ${sender ? 'ml-auto' : 'mr-auto'} `
    return (

    <div className={className_}>
        {message}
    </div>
    
    )
}