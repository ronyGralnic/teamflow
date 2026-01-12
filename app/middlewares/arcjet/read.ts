import arject, { slidingWindow} from "@/lib/arject"
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { ArcjetNextRequest } from "@arcjet/next";

const buildStandardAj = () => 
    arject.withRule(
        slidingWindow({
            mode:"LIVE",
            interval:"1m",
            max:180
        })
    )



export const readSecurityMiddleware = base.
$context<{
    request: Request | ArcjetNextRequest;
    user: KindeUser<Record<string, unknown>>;
}>()
.middleware(async({context, next, errors}) => {
    const decision = await buildStandardAj().protect(context.request, {
        userId: context.user.id,
         
    });
    if (decision.isDenied()){
        if (decision.reason.isRateLimit()){
            throw errors.RATE_LIMITED({
                message:"Too many impactual changes, please slow down",
            })
            
             
        }

       
        throw errors.FORBIDDEN({
            message:"rquest blocked!"
        })
    }
    return next()





});

