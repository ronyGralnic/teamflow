import arject, { sensitiveInfo, slidingWindow} from "@/lib/arject"
import { base } from "../base";
import { KindeUser } from "@kinde-oss/kinde-auth-nextjs";
import { ArcjetNextRequest } from "@arcjet/next";

const buildStandardAj = () => 
    arject.withRule(
        slidingWindow({
            mode:"LIVE",
            interval:"1m",
            max:40
        })
    ).withRule(
        sensitiveInfo({
            mode:"LIVE",
            deny:['PHONE_NUMBER',"CREDIT_CARD_NUMBER"]
        })
    )



export const writeSecurityMiddleware = base.
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

        if (decision.reason.isSensitiveInfo()){
            throw errors.BAD_REQUEST({
                message:"Sensitive Information detected, please remove PII (e.g. creadit card, phone numbers)",
            })
            
             
        }

       
        throw errors.FORBIDDEN({
            message:"rquest blocked!"
        })
    }
    return next()





});

